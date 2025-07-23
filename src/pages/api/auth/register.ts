import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/validations/auth.validation";
import { ApiError } from "../../../lib/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();

  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map((err) => err.message).join(", ");
    throw new ApiError(400, errorMessage, "VALIDATION_ERROR");
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
    let errorMessage = "An error occurred during registration.";
    let errorCode = "REGISTRATION_FAILED";

    if (error.message.includes("User already registered")) {
      errorMessage = "A user with this email address already exists.";
      errorCode = "USER_ALREADY_EXISTS";
    } else if (error.message.includes("Password should be at least 6 characters")) {
      errorMessage = "Password must be at least 6 characters long.";
      errorCode = "PASSWORD_TOO_SHORT";
    } else if (error.message.includes("Unable to validate email address")) {
      errorMessage = "Invalid email address format.";
      errorCode = "INVALID_EMAIL";
    } else if (error.message.includes("Signup is disabled")) {
      errorMessage = "Registration is currently disabled.";
      errorCode = "SIGNUP_DISABLED";
    }

    throw new ApiError(400, errorMessage, errorCode);
  }

  if (!data.user) {
    throw new ApiError(400, "Could not create account.", "ACCOUNT_CREATION_FAILED");
  }

  // Check if the user needs to confirm their email
  if (data.user && !data.session) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Please check your inbox and confirm your email address to complete registration.",
        redirectTo: "/auth/login",
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

  // Automatic login after registration (if email confirmation is disabled)
  return new Response(
    JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      redirectTo: "/recipes",
      message: "Account created successfully.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
