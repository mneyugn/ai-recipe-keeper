import type { APIRoute } from "astro";
import { z } from "zod";
import type { ExtractFromUrlResponseDTO } from "../../../types";
import { recipeExtractionService, urlScraperService } from "../../../lib/services";
import { ApiError } from "../../../lib/errors";
import { SUPPORTED_URL_DOMAINS } from "../../../lib/constants";

const extractFromUrlSchema = z.object({
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          return SUPPORTED_URL_DOMAINS.some((domain) => parsedUrl.hostname.endsWith(domain));
        } catch {
          return false;
        }
      },
      {
        message: `URL must be from a supported domain: ${SUPPORTED_URL_DOMAINS.join(", ")}`,
      }
    ),
});

export const prerender = false;

/**
 * POST /api/recipe/extract-from-url
 * Extracts recipe data from a supported URL using web scraping and AI
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required.", "AUTH_REQUIRED");
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new ApiError(400, "Content-Type must be application/json.", "INVALID_CONTENT_TYPE");
  }
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON format.", "INVALID_JSON");
  }

  const validationResult = extractFromUrlSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new ApiError(400, firstError.message, "INVALID_URL");
  }

  const { url } = validationResult.data;

  // check daily extraction limit
  const isUnderLimit = await recipeExtractionService.checkDailyLimit(locals.supabase, userId);
  if (!isUnderLimit) {
    throw new ApiError(429, "Daily extraction limit exceeded (100/day).", "DAILY_LIMIT_EXCEEDED");
  }

  const startTime = Date.now();
  const extractionResult = await urlScraperService.extractFromUrl(url);
  const generationDuration = Date.now() - startTime;

  if (extractionResult.hasErrors) {
    // log failed extraction attempt and throw an error
    await recipeExtractionService.logExtractionAttempt(
      locals.supabase,
      userId,
      url,
      null,
      `Validation errors: ${extractionResult.warnings.join(", ")}`,
      null,
      generationDuration
    );
    throw new ApiError(
      422,
      "Failed to extract key recipe data from the provided URL. Please ensure it contains a valid recipe.",
      "AI_EXTRACTION_ERROR"
    );
  }

  // log successful extraction and increment daily counter
  const extractionLogId = await recipeExtractionService.logExtractionAttempt(
    locals.supabase,
    userId,
    url, // URL as input data
    extractionResult.data,
    extractionResult.warnings.length > 0 ? `Warnings: ${extractionResult.warnings.join(", ")}` : null,
    null, // tokens will be available in future update
    generationDuration
  );
  await recipeExtractionService.incrementDailyCount(locals.supabase, userId);

  // prepare and return the successful response
  const response: ExtractFromUrlResponseDTO = {
    extraction_log_id: extractionLogId,
    extracted_data: extractionResult.data,
    warnings: extractionResult.warnings.length > 0 ? extractionResult.warnings : undefined,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
