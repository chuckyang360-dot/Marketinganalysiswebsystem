from __future__ import annotations

from pydantic import BaseModel

from ..schemas.product import ProductContextSchema, ProductImageUnderstandingSchema, ProductRawInputSchema
from .image_understanding_service import product_image_understanding_service
from .input_normalizer import normalize_product_raw_input
from .product_context_builder import product_context_builder_service


class ProductParseArtifacts(BaseModel):
    raw_input: ProductRawInputSchema
    image_understanding: ProductImageUnderstandingSchema
    product_context: ProductContextSchema


class ProductParserService:
    def parse(
        self,
        project_id: int,
        inp: ProductRawInputSchema,
        project_constraints: dict | None = None,
    ) -> ProductParseArtifacts:
        normalized_raw = normalize_product_raw_input(inp)
        image_result = product_image_understanding_service.understand(project_id, normalized_raw)
        product_context = product_context_builder_service.build(
            project_id=project_id,
            raw_input=normalized_raw,
            image_understanding=image_result,
            project_constraints=project_constraints or {},
        )
        return ProductParseArtifacts(
            raw_input=normalized_raw,
            image_understanding=image_result,
            product_context=product_context,
        )


product_parser_service = ProductParserService()
