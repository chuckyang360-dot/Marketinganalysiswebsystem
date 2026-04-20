import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../services/api';
import { ShortDramaLayout } from './components/ShortDramaLayout';
import { listShortDramaProjects, ShortDramaApiError } from './services/shortDramaApi';
import type { ShortDramaProjectDto } from './types/shortDramaApi';

function statusLabel(status: ShortDramaProjectDto['overall_status']): string {
  if (status === 'completed') return 'completed';
  if (status === 'generating') return 'generating';
  if (status === 'stale') return 'stale';
  return 'draft';
}

function actionLabel(status: ShortDramaProjectDto['overall_status']): string {
  if (status === 'completed') return '查看成片';
  if (status === 'stale') return '继续更新';
  if (status === 'generating') return '查看进度';
  return '继续编辑';
}

export function ShortDramaProjectsPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ShortDramaProjectDto[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await listShortDramaProjects(user.id);
        setProjects(res.projects || []);
        console.info('[FRONT_PROJECT_LIST_LOADED]', { user_id: user.id, count: res.projects?.length ?? 0 });
      } catch (e) {
        const msg = e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : '加载项目列表失败';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const sorted = useMemo(() => projects, [projects]);

  return (
    <ShortDramaLayout headerMode="landing">
      <div className="min-h-screen bg-[#F7F8FA] px-6 py-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1D1D1F]" style={{ fontFamily: "'Syne', sans-serif" }}>ShortDrama 项目</h1>
          <p className="mt-1 text-[13px] text-[#8E8E93]">继续编辑草稿、处理中和已完成项目。</p>
        </div>
        {!user?.id ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">请先登录后查看项目列表。</div> : null}
        {loading ? <div className="text-[13px] text-[#8E8E93]">加载中...</div> : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">{error}</div> : null}
          <div className="space-y-3">
            {sorted.map((p) => (
              <div
                key={p.id}
                className="w-full rounded-2xl border border-[#EAEAEA] bg-white px-5 py-4"
              >
                {console.info('[FRONT_PROJECT_CARD_RENDERED]', { project_id: p.id, overall_status: p.overall_status || 'draft' })}
                <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[2fr_1.2fr_1.2fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#1D1D1F]">{p.project_name || `项目 ${p.id}`}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[#8E8E93]">
                      <span>project_id: {p.id}</span>
                      <span>updated_at: {p.updated_at || '-'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[12px] text-[#6E6E73]">
                    <span>last_active_step: {p.last_active_step || 'step_1'}</span>
                    <span>overall_status: {statusLabel(p.overall_status)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[12px] text-[#6E6E73]">
                    <span>final_video: {p.final_video_url ? 'yes' : 'no'}</span>
                    <span>step4_status: {p.step_status?.step_4 || 'not_started'}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11px] text-[#444444]">{statusLabel(p.overall_status)}</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/short-drama/projects/${p.id}`)}
                      className="rounded-lg bg-[#1D1D1F] px-3.5 py-2 text-[12.5px] font-semibold text-white"
                    >
                      {actionLabel(p.overall_status)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShortDramaLayout>
  );
}
