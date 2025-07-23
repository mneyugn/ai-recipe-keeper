import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";
import { ApiError } from "../lib/errors";
import type { ErrorResponseDTO } from "../types";

// Public paths that do not require authentication
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/reset",
  "/auth/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset",
  "/api/auth/reset-confirm",
  "/api/auth/logout",
];

// This sequence combines authentication and error handling into a single export.
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Create a Supabase client instance for this specific request
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });
  context.locals.supabase = supabase;

  // 2. Handle authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    context.locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // 3. Global error handling
  try {
    // If the user is not authenticated and the path is not public, redirect to login
    if (!user && !PUBLIC_PATHS.includes(context.url.pathname)) {
      return context.redirect("/auth/login");
    }

    // Proceed to the next middleware or page
    return await next();
  } catch (error) {
    // Log the full error for debugging purposes
    console.error("An error occurred in the middleware chain:", error);

    // If it's a known API error, format it for the client
    if (error instanceof ApiError) {
      const errorBody: ErrorResponseDTO = {
        error: {
          code: error.errorCode || "API_ERROR",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorBody), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For unknown errors, return a generic 500 response
    const genericErrorBody: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    };
    return new Response(JSON.stringify(genericErrorBody), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
