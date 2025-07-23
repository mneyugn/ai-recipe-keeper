import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service";
import { ApiError } from "../../../lib/errors";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // check authentication
    const userId = locals.user?.id;

    if (!userId) {
      throw new ApiError(401, "Authentication required.", "UNAUTHORIZED");
    }

    if (!locals.supabase) {
      throw new ApiError(500, "Server configuration error.", "INTERNAL_SERVER_ERROR");
    }

    const userService = new UserService(locals.supabase);
    const userProfile = await userService.getUserProfile(userId);

    return new Response(JSON.stringify(userProfile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return new Response(JSON.stringify({ error: { code: error.errorCode, message: error.message } }), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    console.error("Error in GET /api/users/profile:", error);
    throw new ApiError(500, "Internal server error.", "INTERNAL_SERVER_ERROR");
  }
};
