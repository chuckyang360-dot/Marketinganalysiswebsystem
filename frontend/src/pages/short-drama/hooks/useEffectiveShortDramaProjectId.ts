import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getShortDramaSession } from '../utils/shortDramaStorage';
import { useShortDramaProject } from './useShortDramaProject';

function parseQueryProjectId(searchParams: URLSearchParams): number | null {
  const q = searchParams.get('projectId') ?? searchParams.get('project_id');
  if (!q?.trim()) return null;
  const n = Number(q);
  if (!Number.isFinite(n)) return null;
  const id = Math.trunc(n);
  return id > 0 ? id : null;
}

/**
 * 优先使用 URL `?projectId=`（写入 session），否则使用 session 中的当前项目。
 * 数据回填请始终拉 pipeline，勿依赖本 hook 作为业务数据真相源。
 */
export function useEffectiveShortDramaProjectId() {
  const [searchParams] = useSearchParams();
  const { projectId: sessionProjectId, projectName, setSession, refresh, clearSession, session } =
    useShortDramaProject();

  const queryProjectId = useMemo(() => parseQueryProjectId(searchParams), [searchParams]);

  useEffect(() => {
    if (queryProjectId == null) return;
    const existing = getShortDramaSession();
    if (existing?.projectId === queryProjectId) {
      refresh();
      return;
    }
    setSession(queryProjectId);
  }, [queryProjectId, setSession, refresh]);

  const effectiveProjectId = queryProjectId ?? sessionProjectId;

  return {
    effectiveProjectId,
    queryProjectId,
    sessionProjectId,
    projectName,
    setSession,
    refreshSession: refresh,
    clearSession,
    session,
  };
}
