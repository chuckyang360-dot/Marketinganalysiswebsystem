import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateShortDramaSegmentScripts,
  generateShortDramaSegmentVideos,
  generateShortDramaSingleSegmentVideo,
  getShortDramaPipeline,
  mergeShortDramaProjectVideo,
  ShortDramaApiError,
} from '../services/shortDramaApi';
import type { Step4SegmentItem, Step4VideoStatusMap } from '../types/shortDrama';
import type { PipelineSummaryDto } from '../types/shortDramaApi';
import {
  mergeVideoStatus,
  pipelineAssetsToStepFourLibraryVm,
  pipelineToStepFourViewModel,
  pipelineUsesMockTestPatternVideo,
  type StepFourAssetLibraryVm,
} from '../utils/stepFourAdapters';
import { resolvePublicMediaUrl } from '../utils/shortDramaMedia';
import { SHORT_DRAMA_UI } from '../utils/shortDramaUiCopy';
import { withProjectQuery } from '../utils/shortDramaRoutes';
import { touchProjectNameFromPipeline } from '../utils/shortDramaStorage';
import { workflowNavProjectName } from '../utils/workflowProjectName';
import { useEffectiveShortDramaProjectId } from './useEffectiveShortDramaProjectId';

export type Step4MergeButtonType = 'merge_only' | 'merge_and_view';

const SEGMENT_COLORS = ['#B45309', '#DC2626', '#047857', '#334155', '#9333EA', '#0F766E'];

const VIDEO_ALLOWED_STATUSES = new Set([
  'assets_ready',
  'segments_generated',
  'video_rendering',
  'video_segments_ready',
  'completed',
]);

function pipelineHasSegmentScripts(p: PipelineSummaryDto | null): boolean {
  const rows = p?.segment_scripts;
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((r) => r != null && typeof r === 'object' && 'segment_id' in r);
}

export type StepFourPhase = 'idle' | 'no_project' | 'loading' | 'generating_segments' | 'ready' | 'error';

export function useStepFourPage() {
  const navigate = useNavigate();
  const { effectiveProjectId: projectId, projectName } = useEffectiveShortDramaProjectId();

  const [pipeline, setPipeline] = useState<PipelineSummaryDto | null>(null);
  const [phase, setPhase] = useState<StepFourPhase>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [segmentScriptsError, setSegmentScriptsError] = useState<string | null>(null);
  const [segmentScriptsBlocked, setSegmentScriptsBlocked] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const [batchGenerating, setBatchGenerating] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [pendingSegmentIds, setPendingSegmentIds] = useState<Set<number>>(() => new Set());

  const [localAdditions, setLocalAdditions] = useState<Step4SegmentItem[]>([]);
  const [activeSegment, setActiveSegment] = useState(1);
  /** 右侧预览：当前片段视频 vs 最终成片 */
  const [previewTarget, setPreviewTarget] = useState<'segment' | 'final'>('segment');

  const refreshPipeline = useCallback(async () => {
    if (projectId == null) return null;
    const p = await getShortDramaPipeline(projectId);
    setPipeline(p);
    touchProjectNameFromPipeline(projectId, p.project?.project_name);
    if (import.meta.env.DEV) {
      console.info('[STEP4_PIPELINE_VIDEO_STATE]', {
        current_video_stage: p.current_video_stage,
        has_all_segment_videos: p.has_all_segment_videos,
        has_final_video: p.has_final_video,
        final_render_status: p.final_render_status,
        final_render_error: p.final_render_error,
        project_status: p.project?.status,
      });
    }
    return p;
  }, [projectId]);

  const pollEpochRef = useRef(0);

  useEffect(() => {
    if (projectId == null || phase !== 'ready') return;
    const stage = pipeline?.current_video_stage ?? '';
    if (stage !== 'segment_rendering' && stage !== 'final_rendering') return;

    pollEpochRef.current += 1;
    const epoch = pollEpochRef.current;
    console.info('[STEP4_POLLING_START]', { reason: 'video_stage', stage });

    const id = window.setInterval(() => {
      void (async () => {
        if (pollEpochRef.current !== epoch) return;
        try {
          const p = await getShortDramaPipeline(projectId);
          if (pollEpochRef.current !== epoch) return;
          setPipeline(p);
          touchProjectNameFromPipeline(projectId, p.project?.project_name);
          const st = p.current_video_stage ?? '';
          if (st !== 'segment_rendering' && st !== 'final_rendering') {
            console.info('[STEP4_POLLING_STOP]', { reason: 'stage_settled', stage: st });
            pollEpochRef.current += 1;
          }
        } catch {
          console.info('[STEP4_POLLING_STOP]', { reason: 'fetch_error' });
          pollEpochRef.current += 1;
        }
      })();
    }, 2800);

    const maxWait = window.setTimeout(
      () => {
        window.clearInterval(id);
        if (pollEpochRef.current === epoch) {
          console.info('[STEP4_POLLING_STOP]', { reason: 'timeout_120s' });
          pollEpochRef.current += 1;
        }
      },
      120_000,
    );

    return () => {
      window.clearInterval(id);
      window.clearTimeout(maxWait);
    };
  }, [projectId, phase, pipeline?.current_video_stage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (projectId == null) {
        setPhase('no_project');
        setPipeline(null);
        setLoadError(null);
        setSegmentScriptsError(null);
        setSegmentScriptsBlocked(null);
        return;
      }

      setPhase('loading');
      setLoadError(null);
      setSegmentScriptsError(null);
      setSegmentScriptsBlocked(null);

      try {
        let p = await getShortDramaPipeline(projectId);
        if (cancelled) return;
        touchProjectNameFromPipeline(projectId, p.project?.project_name);
        setPipeline(p);

        const hasScripts = pipelineHasSegmentScripts(p);
        const st = p.project?.status ?? '';

        if (!hasScripts) {
          if (st === 'asset_specs_generated' || st === 'assets_ready') {
            setPhase('generating_segments');
            try {
              await generateShortDramaSegmentScripts(projectId);
              p = await getShortDramaPipeline(projectId);
              if (cancelled) return;
              setPipeline(p);
              touchProjectNameFromPipeline(projectId, p.project?.project_name);
              if (!pipelineHasSegmentScripts(p)) {
                setSegmentScriptsError(SHORT_DRAMA_UI.stepFour.segmentScriptsFailed);
              }
            } catch (e) {
              if (cancelled) return;
              const msg =
                e instanceof ShortDramaApiError ? e.message : SHORT_DRAMA_UI.stepFour.segmentScriptsFailed;
              setSegmentScriptsError(msg);
              try {
                const refreshed = await getShortDramaPipeline(projectId);
                if (!cancelled) {
                  setPipeline(refreshed);
                  touchProjectNameFromPipeline(projectId, refreshed.project?.project_name);
                }
              } catch {
                /* keep last pipeline */
              }
            }
          } else {
            setSegmentScriptsBlocked(SHORT_DRAMA_UI.stepFour.segmentScriptsBlocked);
          }
        }

        if (cancelled) return;
        setPhase('ready');
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ShortDramaApiError ? e.message : SHORT_DRAMA_UI.error.pipelineLoad;
        setLoadError(msg);
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const pipelineVm = useMemo(() => pipelineToStepFourViewModel(pipeline), [pipeline]);

  const assetLibraryVm: StepFourAssetLibraryVm = useMemo(
    () => pipelineAssetsToStepFourLibraryVm(pipeline?.assets),
    [pipeline?.assets],
  );

  const projectStatus = pipelineVm.projectStatus;
  const canGenerateVideos = VIDEO_ALLOWED_STATUSES.has(projectStatus);
  const hasBackendSegmentScripts = pipelineVm.coreSegments.length > 0;

  useEffect(() => {
    if (pipelineVm.coreSegments.length === 0) {
      setLocalAdditions([]);
    }
  }, [pipelineVm.coreSegments.length, projectId]);

  useEffect(() => {
    const ids = pipelineVm.coreSegments.map((s) => s.id);
    if (ids.length && !ids.includes(activeSegment)) {
      setActiveSegment(ids[0]);
    }
  }, [pipelineVm.coreSegments, activeSegment]);

  useEffect(() => {
    setPreviewTarget('segment');
  }, [activeSegment]);

  const segments = useMemo(() => {
    if (pipelineVm.coreSegments.length === 0) return [];
    return [...pipelineVm.coreSegments, ...localAdditions];
  }, [pipelineVm.coreSegments, localAdditions]);

  const generatingOverrides = useMemo(() => {
    const o: Partial<Record<number, 'generating'>> = {};
    if (batchGenerating) {
      for (const s of pipelineVm.coreSegments) {
        if (s.backendSegmentId) o[s.id] = 'generating';
      }
    }
    pendingSegmentIds.forEach((id) => {
      o[id] = 'generating';
    });
    return o;
  }, [batchGenerating, pendingSegmentIds, pipelineVm.coreSegments]);

  const videoStatus: Step4VideoStatusMap = useMemo(() => {
    const base = { ...pipelineVm.videoStatusFromPipeline };
    for (const s of localAdditions) {
      if (base[s.id] === undefined) base[s.id] = 'idle';
    }
    return mergeVideoStatus(base, generatingOverrides);
  }, [pipelineVm.videoStatusFromPipeline, generatingOverrides, localAdditions]);

  const canMergeAll = pipelineVm.canMergeAll;

  const hasFinalVideo = useMemo(
    () => !!resolvePublicMediaUrl(pipeline?.final_video_url),
    [pipeline?.final_video_url],
  );

  const canCallMergeApi = useMemo(() => {
    if (!canMergeAll) return false;
    return projectStatus === 'video_segments_ready' || projectStatus === 'video_rendering';
  }, [canMergeAll, projectStatus]);

  /** 时间轴 / 底栏：可点「合成」调 API，或已完成且已有成片时走「仅跳转」 */
  const mergePrimaryActionsEnabled = useMemo(() => {
    if (mergeLoading) return false;
    return canCallMergeApi || (projectStatus === 'completed' && hasFinalVideo);
  }, [mergeLoading, canCallMergeApi, projectStatus, hasFinalVideo]);

  const isMockTestPatternVideo = useMemo(() => pipelineUsesMockTestPatternVideo(pipeline), [pipeline]);

  const timelineMergeLabel =
    projectStatus === 'completed' && hasFinalVideo ? '查看完整视频' : '合成完整视频';
  const footerMergeLabel =
    projectStatus === 'completed' && hasFinalVideo ? '查看完整成片' : '合成并查看完整视频';

  const doneCount = useMemo(() => {
    return pipelineVm.coreSegments.filter((s) => !!resolvePublicMediaUrl(s.videoUrl)).length;
  }, [pipelineVm.coreSegments]);

  const displayTotal = pipelineVm.coreSegments.length;

  const navProjectName = useMemo(
    () =>
      workflowNavProjectName({
        pipelineProjectName: pipeline?.project?.project_name,
        sessionProjectName: projectName,
      }),
    [pipeline?.project?.project_name, projectName],
  );

  const handleGenerateAll = useCallback(async () => {
    if (projectId == null || !hasBackendSegmentScripts || !canGenerateVideos) return;
    setGenerateError(null);
    setBatchGenerating(true);
    try {
      await generateShortDramaSegmentVideos(projectId);
      await refreshPipeline();
    } catch (e) {
      const msg = e instanceof ShortDramaApiError ? e.message : SHORT_DRAMA_UI.error.videoBatch;
      setGenerateError(msg);
    } finally {
      setBatchGenerating(false);
    }
  }, [projectId, refreshPipeline, hasBackendSegmentScripts, canGenerateVideos]);

  const runSingleGenerate = useCallback(
    async (segId: number) => {
      if (projectId == null || !canGenerateVideos) {
        if (!canGenerateVideos) setGenerateError(SHORT_DRAMA_UI.stepFour.videoStatusBlocked);
        return;
      }
      const seg = segments.find((s) => s.id === segId);
      if (!seg?.backendSegmentId) {
        setGenerateError(SHORT_DRAMA_UI.stepFour.segmentNotSynced);
        return;
      }
      setGenerateError(null);
      setPendingSegmentIds((prev) => new Set(prev).add(segId));
      try {
        const res = await generateShortDramaSingleSegmentVideo(projectId, seg.backendSegmentId);
        if (!res.ok) {
          setGenerateError(res.error || `片段 ${seg.backendSegmentId} 生成失败`);
        }
        await refreshPipeline();
      } catch (e) {
        const msg = e instanceof ShortDramaApiError ? e.message : SHORT_DRAMA_UI.error.videoSingle;
        setGenerateError(msg);
      } finally {
        setPendingSegmentIds((prev) => {
          const next = new Set(prev);
          next.delete(segId);
          return next;
        });
      }
    },
    [projectId, refreshPipeline, segments, canGenerateVideos],
  );

  const handleGenerateVideo = useCallback(
    async (segId: number) => {
      await runSingleGenerate(segId);
    },
    [runSingleGenerate],
  );

  const handleRegenerate = useCallback(
    async (segId: number) => {
      await runSingleGenerate(segId);
    },
    [runSingleGenerate],
  );

  const mergeFinalVideo = useCallback(
    async (opts: { buttonType: Step4MergeButtonType; navigateOnSuccess: boolean }) => {
      if (projectId == null) return;
      const { buttonType, navigateOnSuccess } = opts;

      console.info('[STEP4_MERGE_BUTTON_CLICK]', {
        button_type: buttonType,
        project_id: projectId,
        current_status: projectStatus,
        has_final_video: hasFinalVideo,
      });

      if (projectStatus === 'completed' && hasFinalVideo) {
        const route = withProjectQuery('/short-drama/overview', projectId);
        console.info('[STEP4_NAVIGATE_OVERVIEW]', { project_id: projectId, route, reason: 'completed_has_final' });
        navigate(route);
        return;
      }

      if (!canCallMergeApi || mergeLoading) return;

      setMergeError(null);
      setMergeLoading(true);
      try {
        const res = await mergeShortDramaProjectVideo(projectId);
        await refreshPipeline();
        const urlResolved = resolvePublicMediaUrl(res.final_video_url);
        if (!urlResolved) {
          setMergeError(SHORT_DRAMA_UI.error.mergeNoFinalUrl);
          return;
        }
        console.info('[STEP4_MERGE_SUCCESS]', {
          button_type: buttonType,
          final_video_url: res.final_video_url,
          navigate_on_success: navigateOnSuccess,
        });
        setPreviewTarget('final');
        if (navigateOnSuccess) {
          const route = withProjectQuery('/short-drama/overview', projectId);
          console.info('[STEP4_NAVIGATE_OVERVIEW]', { project_id: projectId, route, reason: 'post_merge_success' });
          navigate(route);
        }
      } catch (e) {
        const msg = e instanceof ShortDramaApiError ? e.message : SHORT_DRAMA_UI.error.merge;
        setMergeError(msg);
        await refreshPipeline();
      } finally {
        setMergeLoading(false);
      }
    },
    [
      projectId,
      projectStatus,
      hasFinalVideo,
      canCallMergeApi,
      mergeLoading,
      refreshPipeline,
      navigate,
    ],
  );

  const handleAddSegment = useCallback(() => {
    if (pipelineVm.coreSegments.length === 0) return;
    const maxId = segments.length ? Math.max(...segments.map((s) => s.id)) : 0;
    const newId = maxId + 1;
    const colorIndex = segments.length % SEGMENT_COLORS.length;
    const newSegment: Step4SegmentItem = {
      id: newId,
      name: `S${newId} · 新片段`,
      duration: '待定',
      goal: '请填写片段目标',
      characters: [],
      scene: '待设定',
      placement: '待设定',
      color: SEGMENT_COLORS[colorIndex],
      isNew: true,
      shots: [],
    };
    setLocalAdditions((prev) => [...prev, newSegment]);
    setActiveSegment(newId);
    setTimeout(() => {
      document.getElementById(`segment-${newId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [segments, pipelineVm.coreSegments.length]);

  const goCreate = useCallback(() => {
    navigate('/short-drama/create');
  }, [navigate]);

  return {
    projectId,
    navProjectName,
    pipeline,
    pipelineVm,
    phase,
    loadError,
    segmentScriptsError,
    segmentScriptsBlocked,
    generateError,
    mergeError,
    segments,
    activeSegment,
    setActiveSegment,
    previewTarget,
    setPreviewTarget,
    videoStatus,
    batchGenerating,
    mergeLoading,
    canMergeAll,
    canGenerateVideos,
    hasBackendSegmentScripts,
    doneCount,
    displayTotal,
    projectStatus,
    assetLibraryVm,
    handleGenerateAll,
    handleGenerateVideo,
    handleRegenerate,
    mergeFinalVideo,
    mergePrimaryActionsEnabled,
    canCallMergeApi,
    hasFinalVideo,
    timelineMergeLabel,
    footerMergeLabel,
    isMockTestPatternVideo,
    handleAddSegment,
    goCreate,
  };
}
