import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEffectiveShortDramaProjectId } from './useEffectiveShortDramaProjectId';
import {
  generateShortDramaAssetImages,
  generateShortDramaAssetSpecs,
  getShortDramaPipeline,
  ShortDramaApiError,
} from '../services/shortDramaApi';
import type { AssetsPageViewModel } from '../types/shortDrama';
import type { PipelineSummaryDto } from '../types/shortDramaApi';
import {
  assetsBundleEmpty,
  getAssetsBundleCompleteness,
  pipelineAssetsToAssetsPageViewModel,
} from '../utils/assetsPageAdapters';
import { SHORT_DRAMA_UI } from '../utils/shortDramaUiCopy';
import { touchProjectNameFromPipeline } from '../utils/shortDramaStorage';
import { workflowNavProjectName } from '../utils/workflowProjectName';

export type AssetsPagePhase =
  | 'idle'
  | 'no_project'
  | 'loading'
  | 'generating_specs'
  | 'generating_images'
  | 'blocked_prereq'
  | 'ready'
  | 'error';

const POLL_MS = 2000;
const POLL_MAX = 45;

/** 与 AssetsPage 一致：可进入 Step4 的项目状态 */
const CAN_LEAVE_ASSETS_FOR_STEP4 = new Set([
  'assets_ready',
  'segments_generated',
  'video_rendering',
  'completed',
]);

async function waitUntilNotAssetRendering(
  projectId: number,
  initial: PipelineSummaryDto,
  onPipeline: (p: PipelineSummaryDto) => void,
): Promise<PipelineSummaryDto> {
  let p = initial;
  for (let i = 0; i < POLL_MAX && p.project.status === 'assets_rendering'; i++) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    p = await getShortDramaPipeline(projectId);
    onPipeline(p);
  }
  return p;
}

export function useAssetsPage() {
  const { effectiveProjectId, sessionProjectId, projectName, refreshSession } = useEffectiveShortDramaProjectId();
  const [pipeline, setPipeline] = useState<PipelineSummaryDto | null>(null);
  const [phase, setPhase] = useState<AssetsPagePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const [nextStepBusy, setNextStepBusy] = useState(false);
  const [nextStepError, setNextStepError] = useState<string | null>(null);

  const viewModel: AssetsPageViewModel = useMemo(
    () => pipelineAssetsToAssetsPageViewModel(pipeline?.assets ?? null),
    [pipeline],
  );

  const runImageBatch = useCallback(
    async (pid: number) => {
      setPhase('generating_images');
      setEmptyHint(null);
      try {
        await generateShortDramaAssetImages(pid);
      } catch (e) {
        if (e instanceof ShortDramaApiError && e.status === 409) {
          let p = await getShortDramaPipeline(pid);
          p = await waitUntilNotAssetRendering(pid, p, setPipeline);
          setPipeline(p);
          touchProjectNameFromPipeline(pid, p.project?.project_name);
          return;
        }
        throw e;
      }
      let p = await getShortDramaPipeline(pid);
      p = await waitUntilNotAssetRendering(pid, p, setPipeline);
      setPipeline(p);
      touchProjectNameFromPipeline(pid, p.project?.project_name);
    },
    [],
  );

  const runInitialFlow = useCallback(async () => {
    refreshSession();
    const effectivePid = effectiveProjectId;
    if (effectivePid == null) {
      console.info('[FE_ASSET_SPECS_BLOCKED] projectId=null status=n/a reason=no_session_project_id');
      setPhase('no_project');
      setPipeline(null);
      setError(null);
      setEmptyHint(null);
      return;
    }

    setPhase('loading');
    setError(null);
    setEmptyHint(null);

    try {
      let p = await getShortDramaPipeline(effectivePid);
      setPipeline(p);
      touchProjectNameFromPipeline(effectivePid, p.project?.project_name);

      if (p.project.status === 'assets_rendering') {
        setPhase('generating_images');
        setEmptyHint('检测到资产图任务进行中，正在同步状态…');
        p = await waitUntilNotAssetRendering(effectivePid, p, setPipeline);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      }

      const comp = getAssetsBundleCompleteness(p.assets);

      if (p.project.status === 'story_generated') {
        if (comp === 'partial') {
          console.warn(
            `[FE_ASSET_SPECS_BLOCKED] projectId=${effectivePid} status=${p.project.status} reason=story_generated_asset_bundle_partial_use_next_or_retry`,
          );
          setEmptyHint(
            '检测到角色/场景/产品条目不完整（可能为脏数据）。请点击底部「下一步」补齐资产规范生成，或使用上方重试。',
          );
          setPhase('ready');
          return;
        }
        if (comp === 'complete') {
          console.info(
            `[FE_ASSET_SPECS_BLOCKED] projectId=${effectivePid} status=${p.project.status} reason=story_generated_but_asset_bundle_complete_skip_auto_specs`,
          );
          setPhase('ready');
          return;
        }
      }

      if (!assetsBundleEmpty(p.assets)) {
        console.info(
          `[FE_ASSET_SPECS_BLOCKED] projectId=${effectivePid} status=${p.project.status} reason=skip_auto_specs_asset_rows_already_present`,
        );
        if (p.project.status === 'asset_specs_generated') {
          await runImageBatch(effectivePid);
          p = await getShortDramaPipeline(effectivePid);
          setPipeline(p);
          touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
        }
        setPhase('ready');
        return;
      }

      if (p.project.status !== 'story_generated') {
        console.info(
          `[FE_ASSET_SPECS_BLOCKED] projectId=${effectivePid} status=${p.project.status} reason=prerequisite_not_story_generated`,
        );
        setPhase('blocked_prereq');
        setEmptyHint(SHORT_DRAMA_UI.blocked.assetsNeedStory);
        return;
      }

      setPhase('generating_specs');
      console.info(
        `[FE_ASSET_SPECS_TRIGGER] projectId=${effectivePid} status=${p.project.status} trigger=auto`,
      );
      try {
        await generateShortDramaAssetSpecs(effectivePid, { trigger: 'auto' });
      } catch (genErr) {
        if (genErr instanceof ShortDramaApiError && genErr.status === 409) {
          p = await getShortDramaPipeline(effectivePid);
          setPipeline(p);
          touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
          if (!assetsBundleEmpty(p.assets)) {
            if (p.project.status === 'asset_specs_generated') {
              await runImageBatch(effectivePid);
              p = await getShortDramaPipeline(effectivePid);
              setPipeline(p);
              touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
            }
            setPhase('ready');
            return;
          }
        } else {
          throw genErr;
        }
      }

      p = await getShortDramaPipeline(effectivePid);
      setPipeline(p);
      touchProjectNameFromPipeline(effectivePid, p.project?.project_name);

      if (assetsBundleEmpty(p.assets)) {
        setEmptyHint(SHORT_DRAMA_UI.empty.assetsAfterCall);
      } else if (p.project.status === 'asset_specs_generated') {
        await runImageBatch(effectivePid);
        p = await getShortDramaPipeline(effectivePid);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      }

      if (assetsBundleEmpty(p.assets)) {
        setEmptyHint(SHORT_DRAMA_UI.empty.assetsAfterCall);
      }
      setPhase('ready');
    } catch (e) {
      const msg =
        e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : SHORT_DRAMA_UI.error.pipelineLoad;
      setPhase('error');
      setError(msg);
    }
  }, [effectiveProjectId, runImageBatch, refreshSession]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    void runInitialFlow();
  }, [runInitialFlow]);

  const retryLoad = useCallback(() => {
    void runInitialFlow();
  }, [runInitialFlow]);

  const handleNextStep = useCallback(async (): Promise<{ shouldNavigate: boolean; statusAfter?: string }> => {
    setNextStepError(null);
    const effectivePid = effectiveProjectId;

    if (effectivePid == null) {
      const msg = '项目ID丢失，请返回重试';
      setNextStepError(msg);
      console.info('[FE_ASSET_SPECS_BLOCKED] projectId=null status=n/a reason=no_effective_project_id_on_next_click');
      return { shouldNavigate: false };
    }

    setNextStepBusy(true);
    try {
      let p = await getShortDramaPipeline(effectivePid);
      setPipeline(p);
      touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      console.info(`[FE_STEP3_NEXT_CLICK] projectId=${effectivePid} status=${p.project.status}`);

      const comp = getAssetsBundleCompleteness(p.assets);

      if (p.project.status === 'story_generated' && comp !== 'complete') {
        console.info(
          `[FE_STEP3_NEXT_FORCE_SPECS] projectId=${effectivePid} completeness=${comp} status=${p.project.status}`,
        );
        console.info(
          `[FE_ASSET_SPECS_TRIGGER] projectId=${effectivePid} status=${p.project.status} trigger=next_button`,
        );
        try {
          await generateShortDramaAssetSpecs(effectivePid, { trigger: 'next_button' });
        } catch (e) {
          if (e instanceof ShortDramaApiError && e.status === 409) {
            p = await getShortDramaPipeline(effectivePid);
            setPipeline(p);
            touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
          } else {
            const msg =
              e instanceof ShortDramaApiError
                ? e.message
                : e instanceof Error
                  ? e.message
                  : SHORT_DRAMA_UI.error.assetSpecs;
            setNextStepError(msg);
            return { shouldNavigate: false };
          }
        }
        p = await getShortDramaPipeline(effectivePid);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      }

      if (p.project.status === 'asset_specs_generated') {
        await runImageBatch(effectivePid);
        p = await getShortDramaPipeline(effectivePid);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      }

      if (p.project.status === 'assets_rendering') {
        p = await waitUntilNotAssetRendering(effectivePid, p, setPipeline);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      }

      const finalSt = p.project.status;
      if (CAN_LEAVE_ASSETS_FOR_STEP4.has(finalSt)) {
        return { shouldNavigate: true, statusAfter: finalSt };
      }

      setNextStepError(
        `当前项目状态为「${finalSt}」，需到达 assets_ready 等阶段后才能进入下一步。请稍候或点击重试加载。`,
      );
      return { shouldNavigate: false, statusAfter: finalSt };
    } catch (e) {
      const msg =
        e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : SHORT_DRAMA_UI.error.pipelineLoad;
      setNextStepError(msg);
      return { shouldNavigate: false };
    } finally {
      setNextStepBusy(false);
    }
  }, [effectiveProjectId, runImageBatch]);

  const retryGenerateSpecs = useCallback(async () => {
    const effectivePid = effectiveProjectId;
    if (effectivePid == null) {
      console.info('[FE_ASSET_SPECS_BLOCKED] projectId=null status=n/a reason=no_session_project_id_retry_button');
      setError('项目ID丢失，请返回重试');
      setPhase('error');
      return;
    }
    setPhase('generating_specs');
    setError(null);
    setEmptyHint(null);
    try {
      console.info(
        `[FE_ASSET_SPECS_TRIGGER] projectId=${effectivePid} status=manual_retry trigger=retry_button`,
      );
      await generateShortDramaAssetSpecs(effectivePid, { trigger: 'retry_button' });
      let p = await getShortDramaPipeline(effectivePid);
      setPipeline(p);
      touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      if (assetsBundleEmpty(p.assets)) {
        setEmptyHint(SHORT_DRAMA_UI.empty.assetsStillNone);
      } else if (p.project.status === 'asset_specs_generated') {
        await runImageBatch(effectivePid);
        p = await getShortDramaPipeline(effectivePid);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
      }
      setPhase('ready');
    } catch (e) {
      if (e instanceof ShortDramaApiError && e.status === 409) {
        const p = await getShortDramaPipeline(effectivePid);
        setPipeline(p);
        touchProjectNameFromPipeline(effectivePid, p.project?.project_name);
        setPhase('ready');
        setEmptyHint(SHORT_DRAMA_UI.empty.assetsStateAdvanced);
        return;
      }
      const msg =
        e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : SHORT_DRAMA_UI.error.assetSpecs;
      setPhase('error');
      setError(msg);
    }
  }, [effectiveProjectId, runImageBatch]);

  const displayProjectName = workflowNavProjectName({
    pipelineProjectName: pipeline?.project?.project_name,
    sessionProjectName: projectName,
  });

  const canClickNext = useMemo(() => {
    const st = pipeline?.project?.status;
    if (effectiveProjectId == null || st == null) return false;
    if (CAN_LEAVE_ASSETS_FOR_STEP4.has(st)) return true;
    return st === 'story_generated' || st === 'asset_specs_generated' || st === 'assets_rendering';
  }, [effectiveProjectId, pipeline?.project?.status]);

  return {
    projectId: sessionProjectId,
    effectiveProjectId,
    projectName: displayProjectName,
    pipeline,
    phase,
    error,
    emptyHint,
    viewModel,
    retryLoad,
    retryGenerateSpecs,
    handleNextStep,
    nextStepBusy,
    nextStepError,
    canClickNext,
  };
}
