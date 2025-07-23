import type { APIRoute } from "astro";
import { z } from "zod";
import { ApiError } from "../../../../../lib/errors";

const feedbackSchema = z.object({
  feedback: z.enum(["positive", "negative"]),
});

export const prerender = false;

/**
 * POST /api/recipe/extraction/{logId}/feedback
 * Submits feedback for a specific extraction attempt
 */
export const POST: APIRoute = async ({ request, params }) => {
  const { logId } = params;

  if (!logId) {
    throw new ApiError(400, "Extraction log ID is required.", "MISSING_LOG_ID");
  }

  // Validation of Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new ApiError(400, "Content-Type must be application/json.", "INVALID_CONTENT_TYPE");
  }

  // Parse JSON
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON format.", "INVALID_JSON");
  }

  // Validation of request body using Zod
  const validationResult = feedbackSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new ApiError(400, firstError.message, "INVALID_FEEDBACK");
  }

  // const { _feedback } = validationResult.data;

  // TODO:
  // 1. Verify that the extraction log exists
  // 2. Store the feedback in the database
  // 3. Optionally use the feedback to improve AI model

  //   console.log(`Received feedback for extraction ${logId}: ${feedback}`);

  // For now, just return success
  return new Response(null, {
    status: 204,
  });
};
