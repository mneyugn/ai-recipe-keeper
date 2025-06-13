import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/validations/auth.validation";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja Zod
    try {
      registerSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((err) => err.message).join(", ");
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const { email, password } = body;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Mapowanie błędów Supabase na przyjazne komunikaty po polsku
      let errorMessage = "Wystąpił błąd podczas rejestracji";

      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik z tym adresem email już istnieje";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Hasło musi mieć co najmniej 6 znaków";
      } else if (error.message.includes("Unable to validate email address")) {
        errorMessage = "Nieprawidłowy format adresu email";
      } else if (error.message.includes("Signup is disabled")) {
        errorMessage = "Rejestracja jest obecnie wyłączona";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Nie udało się utworzyć konta" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sprawdzamy czy użytkownik potrzebuje potwierdzić email
    if (data.user && !data.session) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Sprawdź swoją skrzynkę email i potwierdź adres, aby dokończyć rejestrację",
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Automatyczne logowanie po rejestracji (jeśli email confirmation jest wyłączone)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        redirectTo: "/recipes",
        message: "Konto zostało utworzone pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
