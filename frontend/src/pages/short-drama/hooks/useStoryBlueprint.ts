import { useCallback, useEffect, useState } from 'react';
import type { PipelineSummaryDto } from '../types/shortDramaApi';
import { generateShortDramaStory, getShortDramaPipeline, ShortDramaApiError } from '../services/shortDramaApi';
import { SHORT_DRAMA_UI } from '../utils/shortDramaUiCopy';
import { STORY_PIPELINE_LOCKED_STATUSES } from '../utils/storyBlueprintDerived';
import { touchProjectNameFromPipeline } from '../utils/shortDramaStorage';

export function useStoryBlueprint(projectId: number | null) {
  const [pipeline, setPipeline] = useState<PipelineSummaryDto | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const loadPipeline = useCallback(async () => {
    if (projectId == null) return;
    setPipelineLoading(true);
    setPipelineError(null);
    try {
      const p = await getShortDramaPipeline(projectId);
      setPipeline(p);
      touchProjectNameFromPipeline(projectId, p.project?.project_name);
      console.info('[FRONT_PROJECT_DATA_RESTORED]', { project_id: projectId, page: 'step_2' });
    } catch (e) {
      const msg =
        e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : SHORT_DRAMA_UI.error.pipelineLoad;
      setPipelineError(msg);
    } finally {
      setPipelineLoading(false);
    }
  }, [projectId]);

  const generate = useCallback(async () => {
    if (projectId == null) return;
    const st = pipeline?.project?.status;
    if (st && STORY_PIPELINE_LOCKED_STATUSES.has(st)) return;
    setGenerateLoading(true);
    setGenerateError(null);
    try {
      await generateShortDramaStory(projectId);
      console.info('[FRONT_STEP_STATUS_UPDATED]', { project_id: projectId, step: 'step_2', action: 'save_generate_story' });
      await loadPipeline();
    } catch (e) {
      const msg =
        e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : SHORT_DRAMA_UI.error.storyGenerate;
      setGenerateError(msg);
    } finally {
      setGenerateLoading(false);
    }
  }, [projectId, pipeline, loadPipeline]);

  useEffect(() => {
    if (projectId != null) void loadPipeline();
  }, [projectId, loadPipeline]);

  return {
    pipeline,
    pipelineLoading,
    pipelineError,
    generate,
    generateLoading,
    generateError,
    loadPipeline,
  };
}
