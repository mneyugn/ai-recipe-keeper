import type { APIRoute } from "astro";
import { createRequestContainer } from "../../../lib/core/container";
import { withErrorHandler } from "../../../lib/api/middleware/errorHandler";
import { ExtractionController } from "../../../lib/modules/extraction/extraction.controller";

export const prerender = false;

/**
 * POST /api/recipe/extract-from-text
 * Extracts recipe data from unstructured text using AI and returns structured data
 */
export const POST: APIRoute = withErrorHandler(async (context) => {
  const container = createRequestContainer(context);
  const extractionController = container.resolve(ExtractionController);

  return await extractionController.extractFromText(context);
});
