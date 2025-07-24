import "reflect-metadata";
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

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

  // 3. Authentication check
  // If the user is not authenticated and the path is not public, redirect to login
  if (!user && !PUBLIC_PATHS.includes(context.url.pathname)) {
    return context.redirect("/auth/login");
  }

  // Proceed to the next middleware or page
  return await next();
});
