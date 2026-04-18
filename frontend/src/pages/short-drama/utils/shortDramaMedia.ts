import { API_BASE_URL } from '../../../config/api';

/** 无具体商品/场景的通用竖屏占位（不含家具等主题词） */
export const NEUTRAL_VERTICAL_POSTER =
  'https://readdy.ai/api/search-image?query=abstract%20soft%20gradient%209x16%20vertical%20minimal%20clean%20background%20no%20objects%20neutral%20light&width=270&height=480&seq=sd-neutral-vp&orientation=portrait';

/** 将后端返回的相对媒体路径（含视频）补全为可播放 / 可展示的绝对 URL */
export function resolvePublicMediaUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (u.startsWith('data:') || u.startsWith('blob:')) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/')) {
    const base = API_BASE_URL.replace(/\/$/, '');
    return base ? `${base}${u}` : u;
  }
  return null;
}
