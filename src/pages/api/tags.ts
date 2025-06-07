import type { APIRoute } from "astro";
import { TagService } from "../../lib/services/TagService";
import type { TagListResponseDTO, ErrorResponseDTO } from "../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Inicjalizacja TagService z klientem Supabase z context.locals
    const tagService = new TagService(locals.supabase);

    // Pobranie aktywnych tagów
    const tags = await tagService.getActiveTags();

    // Przygotowanie odpowiedzi
    const response: TagListResponseDTO = {
      tags,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("GET /api/tags: Error occurred:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "DATABASE_ERROR",
        message: "Nie udało się pobrać tagów. Spróbuj ponownie później.",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
