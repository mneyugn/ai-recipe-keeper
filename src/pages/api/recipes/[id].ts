import type { APIRoute } from "astro";
import { RecipeService } from "../../../lib/services/recipe.service";
import { validateRecipeId, validateUpdateRecipeCommand } from "../../../lib/validations/recipe";
import type { RecipeDetailDTO, ErrorResponseDTO } from "../../../types";
import { supabaseClient } from "../../../db/supabase.client";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/recipes/[id]
 * Pobiera szczegóły konkretnego przepisu
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // 2. Walidacja ID przepisu
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "missing_recipe_id",
            message: "Brak ID przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let validatedId: string;
    try {
      validatedId = validateRecipeId(id);
    } catch (error) {
      console.error("Błąd walidacji ID przepisu:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_recipe_id",
            message: "Nieprawidłowy format ID przepisu",
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

    // 4. Pobieranie szczegółów przepisu
    let recipeDetails: RecipeDetailDTO;
    try {
      recipeDetails = await recipeService.getRecipeDetails(validatedId, userId);
    } catch (error) {
      console.error("Błąd podczas pobierania szczegółów przepisu:", error);

      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      if (errorMessage.includes("nie został znaleziony") || errorMessage.includes("Brak uprawnień")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "Przepis nie został znaleziony",
            },
          } as ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "database_error",
            message: "Nie udało się pobrać szczegółów przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Zwrócenie szczegółów przepisu
    return new Response(JSON.stringify(recipeDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Nieoczekiwany błąd w endpoincie GET /api/recipes/[id]:", error);
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
 * PUT /api/recipes/[id]
 * Aktualizuje istniejący przepis
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // 2. Walidacja ID przepisu
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "missing_recipe_id",
            message: "Brak ID przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let validatedId: string;
    try {
      validatedId = validateRecipeId(id);
    } catch (error) {
      console.error("Błąd walidacji ID przepisu:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_recipe_id",
            message: "Nieprawidłowy format ID przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Walidacja Content-Type
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

    // 4. Parsowanie JSON
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

    // 5. Walidacja danych wejściowych
    let validatedCommand;
    try {
      validatedCommand = validateUpdateRecipeCommand(requestBody);
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

    // 6. Inicjalizacja serwisu
    const recipeService = new RecipeService(supabaseClient);

    // 7. Aktualizacja przepisu
    let updatedRecipe: RecipeDetailDTO;
    try {
      updatedRecipe = await recipeService.updateRecipe(validatedId, userId, validatedCommand);
    } catch (error) {
      console.error("Błąd podczas aktualizacji przepisu:", error);

      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      if (errorMessage.includes("nie został znaleziony") || errorMessage.includes("Brak uprawnień")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "Przepis nie został znaleziony",
            },
          } as ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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
            message: "Nie udało się zaktualizować przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 8. Zwrócenie zaktualizowanego przepisu
    return new Response(JSON.stringify(updatedRecipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Nieoczekiwany błąd w endpoincie PUT /api/recipes/[id]:", error);
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
 * DELETE /api/recipes/[id]
 * Usuwa przepis
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // 2. Walidacja ID przepisu
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "missing_recipe_id",
            message: "Brak ID przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let validatedId: string;
    try {
      validatedId = validateRecipeId(id);
    } catch (error) {
      console.error("Błąd walidacji ID przepisu:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_recipe_id",
            message: "Nieprawidłowy format ID przepisu",
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

    // 4. Usunięcie przepisu
    try {
      await recipeService.deleteRecipe(validatedId, userId);
    } catch (error) {
      console.error("Błąd podczas usuwania przepisu:", error);

      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      if (errorMessage.includes("nie został znaleziony") || errorMessage.includes("Brak uprawnień")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "Przepis nie został znaleziony",
            },
          } as ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "database_error",
            message: "Nie udało się usunąć przepisu",
          },
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Zwrócenie pustej odpowiedzi (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Nieoczekiwany błąd w endpoincie DELETE /api/recipes/[id]:", error);
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
