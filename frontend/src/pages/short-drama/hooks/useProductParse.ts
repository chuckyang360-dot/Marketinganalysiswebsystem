import { useCallback } from 'react';
import type { ProductInputDraft, ProductPreviewSummary } from '../types/shortDrama';
import { parseShortDramaProduct, ShortDramaApiError } from '../services/shortDramaApi';
import { mapDraftToProductInputPayload, productContextToPreview } from '../utils/shortDramaAdapters';
import { SHORT_DRAMA_UI } from '../utils/shortDramaUiCopy';
import {
  normalizeProductParseError,
  PRODUCT_PARSE_GENERIC_MESSAGE,
  PRODUCT_PARSE_SERVICE_UNAVAILABLE_MESSAGE,
} from '../utils/productParseErrors';

export function useProductParse() {
  const parse = useCallback(async (
    projectId: number,
    draft: ProductInputDraft,
    mode: 'replace_all' | 'preserve_user_edited' = 'replace_all',
  ): Promise<{ preview: ProductPreviewSummary; updatedFields: string[]; preservedFields: string[]; fromVersion?: number | null }> => {
    const input = mapDraftToProductInputPayload(draft);
    const res = await parseShortDramaProduct(projectId, input, mode);
    console.info('[FRONT_STEP_STATUS_UPDATED]', { project_id: projectId, step: 'step_1', action: 'save_parse_product' });
    return {
      preview: productContextToPreview(res.product_context),
      updatedFields: res.updated_fields ?? [],
      preservedFields: res.preserved_fields ?? [],
      fromVersion: res.from_version,
    };
  }, []);

  const parseSafe = useCallback(
    async (
      projectId: number,
      draft: ProductInputDraft,
      mode: 'replace_all' | 'preserve_user_edited' = 'replace_all',
    ): Promise<{ preview: ProductPreviewSummary; updatedFields: string[]; preservedFields: string[]; fromVersion?: number | null }> => {
      try {
        return await parse(projectId, draft, mode);
      } catch (e) {
        const rawMsg = e instanceof ShortDramaApiError
          ? (e.message?.trim()
            || (e.status === 500 ? PRODUCT_PARSE_SERVICE_UNAVAILABLE_MESSAGE : PRODUCT_PARSE_GENERIC_MESSAGE))
          : e instanceof Error
            ? e.message
            : SHORT_DRAMA_UI.error.productParse;
        const msg = normalizeProductParseError(rawMsg);
        return {
          preview: {
            productName: '',
            productCategory: '',
            productSummary: '',
            coreSellingPoints: [],
            targetUsers: [],
            usageScenarios: [],
            visualFeatures: [],
            productForm: '',
            keyFunctions: [],
            emotionalValue: [],
            suitableStoryAngles: [],
            userPainPoints: [],
            visualRiskNotes: [],
            consistencyNotes: [],
            immutableStructureConstraints: [],
            extractedFromImages: [],
            parseConfidence: 0,
            sourceTrace: {},
            fieldMeta: {},
            status: 'error',
            errorMessage: msg,
          },
          updatedFields: [],
          preservedFields: [],
        };
      }
    },
    [parse],
  );

  return { parse, parseSafe };
}
