import { useCallback } from 'react';
import type { ProductInputDraft, ProductPreviewSummary } from '../types/shortDrama';
import { parseShortDramaProduct, ShortDramaApiError } from '../services/shortDramaApi';
import { mapDraftToProductInputPayload, productContextToPreview } from '../utils/shortDramaAdapters';
import { SHORT_DRAMA_UI } from '../utils/shortDramaUiCopy';

export function useProductParse() {
  const parse = useCallback(async (projectId: number, draft: ProductInputDraft): Promise<ProductPreviewSummary> => {
    const input = mapDraftToProductInputPayload(draft);
    const res = await parseShortDramaProduct(projectId, input);
    console.info('[FRONT_STEP_STATUS_UPDATED]', { project_id: projectId, step: 'step_1', action: 'save_parse_product' });
    return productContextToPreview(res.product_context);
  }, []);

  const parseSafe = useCallback(
    async (projectId: number, draft: ProductInputDraft): Promise<ProductPreviewSummary> => {
      try {
        return await parse(projectId, draft);
      } catch (e) {
        const msg =
          e instanceof ShortDramaApiError ? e.message : e instanceof Error ? e.message : SHORT_DRAMA_UI.error.productParse;
        return {
          summary: '',
          sellingPoints: [],
          sceneKeywords: [],
          styleKeywords: [],
          status: 'error',
          errorMessage: msg,
        };
      }
    },
    [parse],
  );

  return { parse, parseSafe };
}
