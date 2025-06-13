import type { APIRoute } from "astro";
import { extractFromTextSchema } from "../../../lib/validations/recipe-extraction";
import { RecipeExtractionService } from "../../../lib/services/recipe-extraction.service";
import type { ExtractFromTextResponseDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/recipe/extract-from-text
 * Extracts recipe data from unstructured text using AI and returns structured data
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie autentyfikacji
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "authentication_required",
            message: "Wymagana autentyfikacja",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validation of Content-Type
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

    // 3. Parse JSON
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

    // 4. Validation of request body using Zod
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

    // 5. Initialize recipe extraction service
    const extractionService = new RecipeExtractionService();

    // 6. Check daily extraction limit
    let isUnderLimit;
    try {
      isUnderLimit = await extractionService.checkDailyLimit(userId);
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

    // 7. Extract recipe data from text using AI
    let extractionResult;
    let extractionLogId;
    const startTime = Date.now();

    try {
      extractionResult = await extractionService.extractFromText(text);
      const generationDuration = Date.now() - startTime;

      // Sprawdź czy są krytyczne błędy (brak składników lub kroków)
      if (extractionResult.hasErrors) {
        // Log failed extraction attempt
        extractionLogId = await extractionService.logExtractionAttempt(
          userId,
          text,
          null,
          `Krytyczne błędy walidacji: ${extractionResult.warnings.join(", ")}`,
          null,
          generationDuration
        );

        return new Response(
          JSON.stringify({
            error: {
              code: "AI_EXTRACTION_ERROR",
              message:
                "Nie udało się wyekstraktować kluczowych danych przepisu z podanego tekstu. Sprawdź czy tekst zawiera przepis kulinarny.",
              details: {
                warnings: extractionResult.warnings.join("; "),
              },
            },
          } as ErrorResponseDTO),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // 8. Log successful extraction to database (nawet z ostrzeżeniami)
      extractionLogId = await extractionService.logExtractionAttempt(
        userId,
        text,
        extractionResult.data,
        extractionResult.warnings.length > 0 ? `Ostrzeżenia: ${extractionResult.warnings.join(", ")}` : null,
        null, // tokens will be available in future update
        generationDuration
      );

      // 9. Increment daily extraction counter
      await extractionService.incrementDailyCount(userId);
    } catch (error) {
      console.error("Error during AI extraction:", error);
      const generationDuration = Date.now() - startTime;

      // Log failed extraction attempt
      try {
        extractionLogId = await extractionService.logExtractionAttempt(
          userId,
          text,
          null,
          error instanceof Error ? error.message : "Unknown error",
          null,
          generationDuration
        );
      } catch (logError) {
        console.error("Error logging failed extraction:", logError);
        // Continue with original error response even if logging fails
      }

      // Return appropriate error based on the type of error
      if (error instanceof Error) {
        if (error.message.includes("klucz API") || error.message.includes("OPENROUTER_API_KEY")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "AI_SERVICE_ERROR",
                message: "Serwis AI jest tymczasowo niedostępny. Spróbuj ponownie za chwilę.",
              },
            } as ErrorResponseDTO),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (error.message.includes("limit") || error.message.includes("rate")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "AI_SERVICE_ERROR",
                message: "Serwis AI jest przeciążony. Spróbuj ponownie za chwilę.",
              },
            } as ErrorResponseDTO),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "AI_SERVICE_ERROR",
            message:
              "Nie udało się przetworzyć tekstu przepisu. Sprawdź czy tekst zawiera przepis kulinarny i spróbuj ponownie.",
          },
        } as ErrorResponseDTO),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 10. Prepare response
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
