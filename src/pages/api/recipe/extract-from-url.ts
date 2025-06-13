import type { APIRoute } from "astro";
import { z } from "zod";
import type { ExtractFromUrlResponseDTO, ErrorResponseDTO } from "../../../types";
import { RecipeExtractionService } from "../../../lib/services/recipe-extraction.service";
import { UrlScraperService } from "../../../lib/services/url-scraper.service";

const extractFromUrlSchema = z.object({
  url: z
    .string()
    .url("Nieprawidłowy format URL")
    .refine((url) => {
      try {
        const parsedUrl = new URL(url);
        return ["aniagotuje.pl", "kwestiasmaku.com"].some((domain) => parsedUrl.hostname.endsWith(domain));
      } catch {
        return false;
      }
    }, "URL musi pochodzić z dozwolonych domen (aniagotuje.pl lub kwestiasmaku.com)"),
});

export const prerender = false;

/**
 * POST /api/recipe/extract-from-url
 * Extracts recipe data from a supported URL using web scraping and AI
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
    const validationResult = extractFromUrlSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_URL",
            message: firstError.message,
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { url } = validationResult.data;

    // 4. Initialize services
    const extractionService = new RecipeExtractionService();
    const scraperService = new UrlScraperService();

    // 5. Check daily extraction limit
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

    // 6. Scrape and extract recipe data from URL
    let extractionResult;
    let extractionLogId;
    const startTime = Date.now();

    try {
      extractionResult = await scraperService.extractFromUrl(url);
      const generationDuration = Date.now() - startTime;

      // Sprawdź czy są krytyczne błędy (brak składników lub kroków)
      if (extractionResult.hasErrors) {
        // Log failed extraction attempt
        extractionLogId = await extractionService.logExtractionAttempt(
          userId,
          url,
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
                "Nie udało się wyekstraktować kluczowych danych przepisu z podanej strony. Sprawdź czy adres zawiera przepis kulinarny.",
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

      // 7. Log successful extraction to database (nawet z ostrzeżeniami)
      extractionLogId = await extractionService.logExtractionAttempt(
        userId,
        url, // URL jako input data
        extractionResult.data,
        extractionResult.warnings.length > 0 ? `Ostrzeżenia: ${extractionResult.warnings.join(", ")}` : null,
        null, // tokens will be available in future update
        generationDuration
      );

      // 8. Increment daily extraction counter
      await extractionService.incrementDailyCount(userId);
    } catch (error) {
      console.error("Error during URL extraction:", error);
      const generationDuration = Date.now() - startTime;

      // Log failed extraction attempt
      try {
        extractionLogId = await extractionService.logExtractionAttempt(
          userId,
          url,
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

        if (error.message.includes("nie jest obsługiwana") || error.message.includes("Wspierane domeny")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "UNSUPPORTED_DOMAIN",
                message: error.message,
              },
            } as ErrorResponseDTO),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (error.message.includes("timeout") || error.message.includes("czas oczekiwania")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "SCRAPING_TIMEOUT",
                message: "Strona internetowa nie odpowiada. Spróbuj ponownie za chwilę.",
              },
            } as ErrorResponseDTO),
            {
              status: 504,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (error.message.includes("HTTP 403") || error.message.includes("Forbidden")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "ACCESS_DENIED",
                message:
                  "Strona blokuje automatyczne pobieranie treści. Spróbuj skopiować tekst przepisu i użyć opcji 'Importuj z tekstu'.",
              },
            } as ErrorResponseDTO),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (error.message.includes("HTTP") || error.message.includes("pobierania strony")) {
          return new Response(
            JSON.stringify({
              error: {
                code: "SCRAPING_ERROR",
                message: "Nie udało się pobrać treści ze strony. Sprawdź czy adres jest poprawny.",
              },
            } as ErrorResponseDTO),
            {
              status: 422,
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
            code: "SCRAPING_ERROR",
            message:
              "Nie udało się pobrać przepisu z podanego URL. Sprawdź czy adres jest poprawny i zawiera przepis kulinarny.",
          },
        } as ErrorResponseDTO),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 9. Prepare response
    const response: ExtractFromUrlResponseDTO = {
      extraction_log_id: extractionLogId,
      extracted_data: extractionResult.data,
      warnings: extractionResult.warnings.length > 0 ? extractionResult.warnings : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in endpoint /api/recipe/extract-from-url:", error);
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
