import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ApiError } from "../../../lib/errors";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    throw new ApiError(400, "An error occurred during logout.", "LOGOUT_FAILED");
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "You have been logged out.",
      redirectTo: "/auth/login",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
