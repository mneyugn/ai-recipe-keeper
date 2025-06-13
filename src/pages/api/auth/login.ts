import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { loginSchema } from "../../../lib/validations/auth.validation";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja Zod
    try {
      loginSchema.parse(body);
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mapowanie błędów Supabase na przyjazne komunikaty po polsku
      let errorMessage = "Wystąpił błąd podczas logowania";

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy email lub hasło";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Potwierdź swój adres email przed logowaniem";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie później";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Nie udało się zalogować" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwracamy sukces z danymi użytkownika
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        redirectTo: "/recipes",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
