"""
Image generation tool.
- Preferred: Google Gemini image model (gemini-2.5-flash-image)
- Fallback: Alibaba Qwen image model (qwen-image-2.0-pro)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

import httpx

from ...config import settings

logger = logging.getLogger(__name__)


class ImageGenerationTool:
    PROVIDER_GEMINI = "Gemini"
    PROVIDER_QWEN = "QwenImage"
    _LOG_PREFIX = "[ImageGenTool]"
    _MAX_IMAGES = 4
    _MAX_REFS = 6
    _GEMINI_MODEL = "gemini-2.5-flash-image"
    _QWEN_MODEL = "qwen-image-2.0-pro"
    _QWEN_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"

    async def generate(self, user_prompt: str, reference_images: List[str]) -> Tuple[List[str], str]:
        prompt, refs = self._validate_inputs(user_prompt, reference_images)

        gemini_images = await self._generate_via_gemini(prompt, refs)
        if gemini_images:
            logger.info("%s provider=%s count=%s", self._LOG_PREFIX, self.PROVIDER_GEMINI, len(gemini_images))
            return gemini_images, self.PROVIDER_GEMINI

        qwen_images = await self._generate_via_qwen(prompt, refs)
        if qwen_images:
            logger.info("%s provider=%s count=%s", self._LOG_PREFIX, self.PROVIDER_QWEN, len(qwen_images))
            return qwen_images, self.PROVIDER_QWEN

        raise ValueError("Gemini 和 Qwen 均未能生成图片，请检查 GEMINI_API_KEY 和 DASHSCOPE_API_KEY")

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
            logger.warning("%s GEMINI_API_KEY 未配置，跳过 Gemini", self._LOG_PREFIX)
            return []

        base = (settings.GEMINI_API_URL or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        model = self._GEMINI_MODEL
        endpoint = f"{base}/models/{model}:generateContent"
        body_prompt = self._compose_prompt(prompt, refs)
        generation_config: Dict[str, Any] = {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.9,
        }

        logger.info("%s try gemini model=%s", self._LOG_PREFIX, model)
        collected: List[str] = []
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
                resp = await client.post(endpoint, params={"key": api_key}, json=payload)
                if resp.status_code == 404:
                    logger.warning("%s model=%s HTTP 404，不可用，回退 Qwen", self._LOG_PREFIX, model)
                    return []
                if resp.status_code != 200:
                    logger.warning(
                        "%s model=%s HTTP %s: %s，回退 Qwen",
                        self._LOG_PREFIX,
                        model,
                        resp.status_code,
                        resp.text[:300],
                    )
                    return []
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
            logger.warning(
                "%s model=%s 仅产出 %s 张，少于 %s 张，回退 Qwen",
                self._LOG_PREFIX,
                model,
                len(collected),
                self._MAX_IMAGES,
            )
            return []
        return collected[: self._MAX_IMAGES]

    def _extract_qwen_image_url(self, payload: Dict[str, Any]) -> str:
        """
        官方结构：
        output.choices[0].message.content[0].image
        """
        output = payload.get("output")
        if not isinstance(output, dict):
            return ""
        choices = output.get("choices")
        if not isinstance(choices, list) or not choices:
            return ""
        first = choices[0]
        if not isinstance(first, dict):
            return ""
        message = first.get("message")
        if not isinstance(message, dict):
            return ""
        content = message.get("content")
        if not isinstance(content, list) or not content:
            return ""
        first_content = content[0]
        if not isinstance(first_content, dict):
            return ""
        image = first_content.get("image")
        if isinstance(image, str) and image.strip():
            return image.strip()
        return ""

    async def _generate_via_qwen(self, prompt: str, refs: List[str]) -> List[str]:
        api_key = (settings.DASHSCOPE_API_KEY or "").strip()
        if not api_key:
            logger.warning("%s DASHSCOPE_API_KEY 未配置，无法使用 Qwen", self._LOG_PREFIX)
            return []

        logger.info("%s try qwen model=%s", self._LOG_PREFIX, self._QWEN_MODEL)
        body_prompt = self._compose_prompt(prompt, refs)
        images: List[str] = []

        async with httpx.AsyncClient(timeout=120.0) as client:
            for attempt in range(1, self._MAX_IMAGES + 1):
                text = body_prompt
                if attempt > 1:
                    text += (
                        f"\n\n（变体 {attempt}/{self._MAX_IMAGES}，"
                        "保持同一商品卖点，构图或背景可略有不同。）"
                    )
                payload = {
                    "model": self._QWEN_MODEL,
                    "input": {
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "text": text
                                    }
                                ],
                            }
                        ]
                    },
                    "parameters": {
                        "size": "2048*2048",
                        "watermark": False,
                        "prompt_extend": True,
                    },
                }
                resp = await client.post(
                    self._QWEN_ENDPOINT,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code >= 400:
                    logger.warning(
                        "%s qwen model=%s HTTP %s: %s",
                        self._LOG_PREFIX,
                        self._QWEN_MODEL,
                        resp.status_code,
                        resp.text[:300],
                    )
                    continue
                data = resp.json() if resp.content else {}
                if not isinstance(data, dict):
                    continue
                img = self._extract_qwen_image_url(data)
                if img and img not in images:
                    images.append(img)
                if len(images) >= self._MAX_IMAGES:
                    break

        images = self._dedupe(images)
        if len(images) < self._MAX_IMAGES:
            logger.warning(
                "%s Qwen 仅产出 %s 张，少于 %s 张",
                self._LOG_PREFIX,
                len(images),
                self._MAX_IMAGES,
            )
            return []
        return images[: self._MAX_IMAGES]
