import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getShortDramaPipeline, ShortDramaApiError } from '../services/shortDramaApi';
import type { PipelineSummaryDto } from '../types/shortDramaApi';
import { pipelineToOverviewViewModel, type OverviewPageViewModel } from '../utils/overviewAdapters';
import { pipelineUsesMockTestPatternVideo } from '../utils/stepFourAdapters';
import { SHORT_DRAMA_UI } from '../utils/shortDramaUiCopy';
import { touchProjectNameFromPipeline } from '../utils/shortDramaStorage';
import { workflowNavProjectName } from '../utils/workflowProjectName';
import { useEffectiveShortDramaProjectId } from './useEffectiveShortDramaProjectId';

export type OverviewPhase = 'idle' | 'no_project' | 'loading' | 'ready' | 'error';

export function useOverviewPage() {
  const navigate = useNavigate();
  const { effectiveProjectId: projectId, projectName } = useEffectiveShortDramaProjectId();

  const [pipeline, setPipeline] = useState<PipelineSummaryDto | null>(null);
  const [phase, setPhase] = useState<OverviewPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (projectId == null) {
      setPhase('no_project');
      setPipeline(null);
      setError(null);
      return;
    }
    setPhase('loading');
    setError(null);
    try {
      const p = await getShortDramaPipeline(projectId);
      setPipeline(p);
      touchProjectNameFromPipeline(projectId, p.project?.project_name);
      console.info('[FRONT_PROJECT_DATA_RESTORED]', { project_id: projectId, page: 'overview' });
      setPhase('ready');
    } catch (e) {
      const msg =
        e instanceof ShortDramaApiError ? e.message : SHORT_DRAMA_UI.error.overviewLoad;
      setError(msg);
      setPhase('error');
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const viewModel: OverviewPageViewModel = useMemo(() => pipelineToOverviewViewModel(pipeline), [pipeline]);

  const isMockTestPatternVideo = useMemo(() => pipelineUsesMockTestPatternVideo(pipeline), [pipeline]);

  const headerProjectName = workflowNavProjectName({
    pipelineProjectName: pipeline?.project?.project_name,
    sessionProjectName: projectName,
  });

  const goCreate = useCallback(() => {
    navigate('/short-drama/create');
  }, [navigate]);

  return {
    projectId,
    headerProjectName,
    phase,
    error,
    viewModel,
    reload: load,
    goCreate,
    isMockTestPatternVideo,
  };
}
