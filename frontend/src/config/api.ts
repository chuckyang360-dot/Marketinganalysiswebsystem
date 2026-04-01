const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim();

// 临时排查日志：用于验证线上是否成功注入环境变量
console.log('[API_BASE_URL]', API_BASE_URL);

export { API_BASE_URL };
