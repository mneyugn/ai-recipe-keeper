import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { UserProfileDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Używanie DEFAULT_USER_ID zamiast autoryzacji
    const userId = DEFAULT_USER_ID;

    // Sprawdzenie czy Supabase client jest dostępny w locals
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Wystąpił błąd serwera",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Utworzenie instancji UserService
    const userService = new UserService(locals.supabase);

    // Pobranie profilu użytkownika
    const userProfile = await userService.getUserProfile(userId);

    // Zwrócenie sukcesu
    return new Response(JSON.stringify(userProfile satisfies UserProfileDTO), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Błąd w GET /api/users/profile:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      if (error.message.includes("nie został znaleziony")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Użytkownik nie został znaleziony",
            },
          } satisfies ErrorResponseDTO),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (error.message.includes("Błąd pobierania danych użytkownika")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Wystąpił błąd serwera",
            },
          } satisfies ErrorResponseDTO),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // Domyślna obsługa błędów
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Wystąpił błąd serwera",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
