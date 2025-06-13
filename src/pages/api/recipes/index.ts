import type { APIRoute } from "astro";
import { RecipeService } from "../../../lib/services/recipe.service";
import { validateRecipeListQuery, validateCreateRecipeCommand } from "../../../lib/validations/recipe";
import type { RecipeListResponseDTO, RecipeDetailDTO, ErrorResponseDTO } from "../../../types";
import { supabaseClient } from "../../../db/supabase.client";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/recipes
 * Pobiera listę przepisów użytkownika z opcjami filtrowania i paginacji
 */
export const GET: APIRoute = async ({ url, locals }) => {
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
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Walidacja query parametrów
    let validatedParams;
    try {
      validatedParams = validateRecipeListQuery(url.searchParams);
    } catch (error) {
      console.error("Błąd walidacji parametrów zapytania:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "validation_error",
            message: "Nieprawidłowe parametry zapytania",
            details: error instanceof ZodError ? error.flatten().fieldErrors : undefined,
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Inicjalizacja serwisu
    const recipeService = new RecipeService(supabaseClient);

    // 4. Pobieranie listy przepisów
    let recipeList: RecipeListResponseDTO;
    try {
      recipeList = await recipeService.getRecipeList(userId, validatedParams);
    } catch (error) {
      console.error("Błąd podczas pobierania listy przepisów:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "database_error",
            message: "Nie udało się pobrać listy przepisów",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(recipeList), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Nieoczekiwany błąd w endpoincie GET /api/recipes:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "internal_error",
          message: "Błąd wewnętrzny serwera",
        },
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/recipes
 * Tworzy nowy przepis
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
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Walidacja Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_content_type",
            message: "Content-Type musi być application/json",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parsowanie JSON
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_json",
            message: "Nieprawidłowy format JSON",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Walidacja danych wejściowych
    let validatedCommand;
    try {
      validatedCommand = validateCreateRecipeCommand(requestBody);
    } catch (error) {
      console.error("Błąd walidacji danych przepisu:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "validation_error",
            message: "Nieprawidłowe dane przepisu",
            details: error instanceof ZodError ? error.flatten().fieldErrors : undefined,
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Inicjalizacja serwisu
    const recipeService = new RecipeService(supabaseClient);

    // 6. Tworzenie przepisu
    let createdRecipe: RecipeDetailDTO;
    try {
      createdRecipe = await recipeService.createRecipe(userId, validatedCommand);
    } catch (error) {
      console.error("Błąd podczas tworzenia przepisu:", error);

      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      // Sprawdzenie czy błąd dotyczy tagów
      if (errorMessage.includes("Nieistniejące tagi")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "invalid_tags",
              message: errorMessage,
            },
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "database_error",
            message: "Nie udało się utworzyć przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Zwrócenie utworzonego przepisu
    return new Response(JSON.stringify(createdRecipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Nieoczekiwany błąd w endpoincie POST /api/recipes:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "internal_error",
          message: "Błąd wewnętrzny serwera",
        },
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
