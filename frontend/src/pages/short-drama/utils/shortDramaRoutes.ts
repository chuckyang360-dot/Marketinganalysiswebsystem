/** 工作流步骤间导航时附带 projectId，避免仅靠 session 丢上下文；页面数据仍以 pipeline API 为准。 */
export function withProjectQuery(path: string, projectId: number | null | undefined): string {
  if (projectId == null || !Number.isFinite(projectId)) return path;
  const id = Math.trunc(projectId);
  if (id <= 0) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}projectId=${encodeURIComponent(String(id))}`;
}
