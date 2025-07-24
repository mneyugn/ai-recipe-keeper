import type { APIRoute } from "astro";
import { createRequestContainer } from "../../../lib/core/container";
import { withErrorHandler } from "../../../lib/api/middleware/errorHandler";
import { ExtractionController } from "../../../lib/modules/extraction/extraction.controller";

export const prerender = false;

/**
 * POST /api/recipe/extract-from-url
 * Extracts recipe data from a supported URL using web scraping and AI
 */
export const POST: APIRoute = withErrorHandler(async (context) => {
  const container = createRequestContainer(context);
  const extractionController = container.resolve(ExtractionController);

  return await extractionController.extractFromUrl(context);
});
