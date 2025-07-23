import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { loginSchema } from "../../../lib/validations/auth.validation";
import { ApiError } from "../../../lib/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();

  const validationResult = loginSchema.safeParse(body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map((err) => err.message).join(", ");
    throw new ApiError(400, errorMessage, "VALIDATION_ERROR");
  }

  const { email, password } = validationResult.data;

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let errorMessage = "An error occurred during login.";
    let errorCode = "LOGIN_FAILED";

    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password.";
      errorCode = "INVALID_CREDENTIALS";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Please confirm your email address before logging in.";
      errorCode = "EMAIL_NOT_CONFIRMED";
    } else if (error.message.includes("Too many requests")) {
      errorMessage = "Too many login attempts. Please try again later.";
      errorCode = "TOO_MANY_REQUESTS";
    }

    throw new ApiError(400, errorMessage, errorCode);
  }

  if (!data.user) {
    throw new ApiError(400, "Login failed. User data not found.", "LOGIN_FAILED");
  }

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
};
