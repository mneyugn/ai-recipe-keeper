import type { APIRoute } from "astro";
import { extractFromTextSchema } from "../../../lib/validations/recipe-extraction";
import { recipeExtractionService } from "../../../lib/services";
import type { ExtractFromTextResponseDTO } from "../../../types";
import { ApiError } from "../../../lib/errors";

export const prerender = false;

/**
 * POST /api/recipe/extract-from-text
 * Extracts recipe data from unstructured text using AI and returns structured data
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Check authentication
  const userId = locals.user?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required.", "AUTH_REQUIRED");
  }

  // 2. Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new ApiError(400, "Content-Type must be application/json.", "INVALID_CONTENT_TYPE");
  }

  // 3. Parse JSON
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON format.", "INVALID_JSON");
  }

  // 4. Validate request body using Zod
  const validationResult = extractFromTextSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    const errorCode = firstError.code === "too_small" && firstError.minimum === 1 ? "MISSING_TEXT" : "TEXT_TOO_LONG";
    throw new ApiError(400, firstError.message, errorCode);
  }

  const { text } = validationResult.data;

  // 5. Check daily extraction limit
  const isUnderLimit = await recipeExtractionService.checkDailyLimit(locals.supabase, userId);
  if (!isUnderLimit) {
    throw new ApiError(429, "Daily extraction limit exceeded (100/day).", "DAILY_LIMIT_EXCEEDED");
  }

  // 6. Extract recipe data from text using AI
  const startTime = Date.now();
  const extractionResult = await recipeExtractionService.extractFromText(text);
  const generationDuration = Date.now() - startTime;

  if (extractionResult.hasErrors) {
    // Log failed extraction attempt and throw an error
    await recipeExtractionService.logExtractionAttempt(
      locals.supabase,
      userId,
      text,
      null,
      `Validation errors: ${extractionResult.warnings.join(", ")}`,
      null,
      generationDuration
    );
    throw new ApiError(
      422,
      "Failed to extract key recipe data from the provided text. Please ensure it contains a valid recipe.",
      "AI_EXTRACTION_ERROR"
    );
  }

  // 7. Log successful extraction and increment daily counter
  const extractionLogId = await recipeExtractionService.logExtractionAttempt(
    locals.supabase,
    userId,
    text,
    extractionResult.data,
    extractionResult.warnings.length > 0 ? `Warnings: ${extractionResult.warnings.join(", ")}` : null,
    null, // tokens will be available in future update
    generationDuration
  );
  await recipeExtractionService.incrementDailyCount(locals.supabase, userId);

  // 8. Prepare and return the successful response
  const response: ExtractFromTextResponseDTO = {
    extraction_log_id: extractionLogId,
    extracted_data: extractionResult.data,
    original_text: text,
    warnings: extractionResult.warnings.length > 0 ? extractionResult.warnings : undefined,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
