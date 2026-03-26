"""
Image generation tool.
- Google Gemini 优先（仅需 GEMINI_API_KEY）
- 失败回退 xAI grok-2-image

说明：公开的 gemini-1.5-flash / gemini-1.5-pro 不承担文生图；需使用支持
responseModalities 含 IMAGE 的模型。默认 GEMINI_IMAGE_MODEL 为官方预览出图模型，
可通过环境变量覆盖；若改用 1.5 仅用于探测，接口通常会返回错误并走 Grok。
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

import httpx

from ...config import settings

logger = logging.getLogger(__name__)


class ImageGenerationTool:
    PROVIDER_GEMINI = "Gemini"
    PROVIDER_GROK = "GrokImage"
    _LOG_PREFIX = "[ImageGenTool]"
    _MAX_IMAGES = 4
    _MAX_REFS = 6

    async def generate(self, user_prompt: str, reference_images: List[str]) -> Tuple[List[str], str]:
        prompt, refs = self._validate_inputs(user_prompt, reference_images)

        try:
            images = await self._generate_via_gemini(prompt, refs)
            logger.info("%s provider=%s count=%s", self._LOG_PREFIX, self.PROVIDER_GEMINI, len(images))
            return images, self.PROVIDER_GEMINI
        except Exception as e:
            logger.warning("%s gemini failed, fallback grok: %s", self._LOG_PREFIX, e)

        images = await self._generate_via_grok(prompt, refs)
        logger.info("%s provider=%s count=%s", self._LOG_PREFIX, self.PROVIDER_GROK, len(images))
        return images, self.PROVIDER_GROK

    def _validate_inputs(self, user_prompt: str, reference_images: List[str]) -> Tuple[str, List[str]]:
        prompt = (user_prompt or "").strip()
        refs = [u for u in (reference_images or []) if isinstance(u, str) and u.strip()][: self._MAX_REFS]
        if not prompt:
            raise ValueError("user_prompt 不能为空")
        if not refs:
            raise ValueError("至少需要选择一张参考图")
        return prompt, refs

    def _compose_prompt(self, prompt: str, refs: List[str]) -> str:
        if not refs:
            return prompt
        lines = "\n".join(f"- {u}" for u in refs)
        return (
            f"{prompt}\n\n"
            "参考图 URL（请在符合平台规范前提下，对齐构图/卖点/调性）：\n"
            f"{lines}"
        ).strip()

    def _dedupe(self, urls: List[str]) -> List[str]:
        seen = set()
        out: List[str] = []
        for u in urls:
            if u in seen:
                continue
            seen.add(u)
            out.append(u)
            if len(out) >= self._MAX_IMAGES:
                break
        return out

    def _extract_inline_images(self, payload: Dict[str, Any]) -> List[str]:
        out: List[str] = []
        for cand in payload.get("candidates") or []:
            if not isinstance(cand, dict):
                continue
            content = cand.get("content") or {}
            for part in content.get("parts") or []:
                if not isinstance(part, dict):
                    continue
                inline = part.get("inlineData") or part.get("inline_data")
                if not isinstance(inline, dict):
                    continue
                mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                b64 = inline.get("data")
                if b64:
                    out.append(f"data:{mime};base64,{b64}")
        return out

    async def _generate_via_gemini(self, prompt: str, refs: List[str]) -> List[str]:
        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key:
            raise ValueError("未配置 GEMINI_API_KEY")

        base = (settings.GEMINI_API_URL or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        model = (settings.GEMINI_IMAGE_MODEL or "gemini-2.0-flash-preview-image-generation").strip()
        endpoint = f"{base}/models/{model}:generateContent"

        logger.info("%s try gemini model=%s", self._LOG_PREFIX, model)
        body_prompt = self._compose_prompt(prompt, refs)
        collected: List[str] = []

        generation_config: Dict[str, Any] = {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.9,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            for attempt in range(1, self._MAX_IMAGES + 1):
                text = body_prompt
                if attempt > 1:
                    text += (
                        f"\n\n（变体 {attempt}/{self._MAX_IMAGES}，"
                        "保持同一商品卖点，构图或背景可略有不同。）"
                    )
                payload = {
                    "contents": [{"parts": [{"text": text}]}],
                    "generationConfig": generation_config,
                }
                resp = await client.post(
                    endpoint,
                    params={"key": api_key},
                    json=payload,
                )
                if resp.status_code != 200:
                    raise ValueError(f"Gemini HTTP {resp.status_code}: {resp.text[:500]}")
                data = resp.json()
                batch = self._extract_inline_images(data)
                for img in batch:
                    if img not in collected:
                        collected.append(img)
                    if len(collected) >= self._MAX_IMAGES:
                        break
                if len(collected) >= self._MAX_IMAGES:
                    break

        if len(collected) < self._MAX_IMAGES:
            raise ValueError(f"Gemini 仅产出 {len(collected)} 张，需要 {self._MAX_IMAGES} 张")
        return collected[: self._MAX_IMAGES]

    async def _generate_via_grok(self, prompt: str, refs: List[str]) -> List[str]:
        api_key = settings.XAI_API_KEY
        if not api_key:
            raise ValueError("未配置 XAI_API_KEY")

        logger.info("%s try grok", self._LOG_PREFIX)
        url = f"{settings.XAI_API_URL.rstrip('/')}/images/generations"
        body_prompt = self._compose_prompt(prompt, refs)
        images: List[str] = []

        async with httpx.AsyncClient(timeout=120.0) as client:
            for _ in range(self._MAX_IMAGES):
                resp = await client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={"model": "grok-2-image", "prompt": body_prompt, "n": 1},
                )
                if resp.status_code >= 400:
                    continue
                payload = resp.json() if resp.content else {}
                item = (payload.get("data") or [{}])[0] if isinstance(payload, dict) else {}
                if isinstance(item, dict) and item.get("url"):
                    images.append(str(item["url"]))
                    continue
                b64 = item.get("b64_json") if isinstance(item, dict) else None
                if b64:
                    images.append(f"data:image/png;base64,{b64}")

        images = self._dedupe(images)
        if len(images) < self._MAX_IMAGES:
            raise ValueError(f"Grok 仅产出 {len(images)} 张，需要 {self._MAX_IMAGES} 张")
        return images[: self._MAX_IMAGES]
