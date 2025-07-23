import type { APIRoute } from "astro";
import { TagService } from "../../lib/services/tag.service";
import type { TagListResponseDTO } from "../../types";
import { ApiError } from "../../lib/errors";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // initialize TagService with Supabase client from context.locals
    const tagService = new TagService(locals.supabase);

    // fetch active tags
    const tags = await tagService.getActiveTags();

    // prepare response
    const response: TagListResponseDTO = {
      tags,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("GET /api/tags: Error occurred:", error);
    throw new ApiError(500, "Failed to fetch tags. Please try again later.", "DATABASE_ERROR");
  }
};
