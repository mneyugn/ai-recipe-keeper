import type { APIRoute } from "astro";
import { z } from "zod";
import type { ExtractFromUrlResponseDTO, ErrorResponseDTO } from "../../../types";
// import { DEFAULT_USER_ID } from "../../../db/supabase.client";

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

    // 4. Check daily extraction limit (same as text extraction)
    // TODO: Implement daily limit check similar to extract-from-text

    // 5. Scrape and extract recipe data from URL (mocked for now)
    try {
      // TODO: Implement actual scraping logic
      // This would typically involve:
      // 1. Fetch the webpage content
      // 2. Parse HTML and extract relevant text
      // 3. Use AI to structure the data
      // 4. Extract any images

      // For now, return mocked data
      const mockExtractedData = {
        name: "Przepis z " + new URL(url).hostname,
        ingredients: ["Składnik 1 z strony", "Składnik 2 z strony", "Składnik 3 z strony"],
        steps: ["Przygotuj składniki zgodnie z instrukcją ze strony", "Gotuj według przepisu"],
        preparation_time: "45 minut",
        suggested_tags: ["deser"],
        image_url: "https://placehold.co/600x400?text=Jedzenie",
        source_url: url,
      };

      // 6. Log extraction attempt
      const extractionLogId = `url-mock-${Date.now()}`;

      // 7. Prepare response
      const response: ExtractFromUrlResponseDTO = {
        extraction_log_id: extractionLogId,
        extracted_data: mockExtractedData,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error during URL extraction:", error);

      return new Response(
        JSON.stringify({
          error: {
            code: "SCRAPING_ERROR",
            message:
              "Nie udało się pobrać przepisu z podanego URL. Sprawdź czy adres jest poprawny i spróbuj ponownie.",
          },
        } as ErrorResponseDTO),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
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
