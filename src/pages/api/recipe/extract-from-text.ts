import type { APIRoute } from "astro";
import { extractFromTextSchema } from "../../../lib/validations/recipe-extraction";
import { RecipeExtractionService } from "../../../lib/services/recipe-extraction.service";
import type { ExtractFromTextResponseDTO, ErrorResponseDTO } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/recipe/extract-from-text
 * Extracts recipe data from unstructured text using AI and returns structured data
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Validation of Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CONTENT_TYPE",
            message: "Content-Type must be application/json",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse JSON
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON format",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validation of request body using Zod
    const validationResult = extractFromTextSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          error: {
            code: firstError.code === "too_small" && firstError.minimum === 1 ? "MISSING_TEXT" : "TEXT_TOO_LONG",
            message: firstError.message,
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { text } = validationResult.data;

    // 4. Initialize recipe extraction service
    const extractionService = new RecipeExtractionService();

    // 5. Check daily extraction limit
    let isUnderLimit;
    try {
      isUnderLimit = await extractionService.checkDailyLimit(DEFAULT_USER_ID);
    } catch (error) {
      console.error("Error checking daily limit:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Internal server error",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!isUnderLimit) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DAILY_LIMIT_EXCEEDED",
            message: "Przekroczono dzienny limit ekstrakcji (100/dzień)",
          },
        } as ErrorResponseDTO),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Extract recipe data from text using AI (mocked)
    let extractedData;
    let extractionLogId;
    try {
      extractedData = await extractionService.extractFromText(text);

      // 7. Log successful extraction to database
      extractionLogId = await extractionService.logExtractionAttempt(DEFAULT_USER_ID, text, extractedData);

      // 8. Increment daily extraction counter
      await extractionService.incrementDailyCount(DEFAULT_USER_ID);
    } catch (error) {
      console.error("Error during AI extraction:", error);

      // Log failed extraction attempt
      try {
        extractionLogId = await extractionService.logExtractionAttempt(
          DEFAULT_USER_ID,
          text,
          null,
          error instanceof Error ? error.message : "Unknown error"
        );
      } catch (logError) {
        console.error("Error logging failed extraction:", logError);
        // Continue with original error response even if logging fails
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "AI_SERVICE_ERROR",
            message: "Temporary error in extraction service",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 9. Prepare response
    const response: ExtractFromTextResponseDTO = {
      extraction_log_id: extractionLogId,
      extracted_data: extractedData,
      original_text: text,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in endpoint /api/recipe/extract-from-text:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
