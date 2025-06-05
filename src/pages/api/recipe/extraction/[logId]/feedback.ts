import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDTO } from "../../../../../types";

const feedbackSchema = z.object({
  feedback: z.enum(["positive", "negative"]),
});

export const prerender = false;

/**
 * POST /api/recipe/extraction/{logId}/feedback
 * Submits feedback for a specific extraction attempt
 */
export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { logId } = params;

    if (!logId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "MISSING_LOG_ID",
            message: "Extraction log ID is required",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validation of Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CONTENT_TYPE",
            message: "Content-Type must be application/json",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse JSON
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON format",
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validation of request body using Zod
    const validationResult = feedbackSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_FEEDBACK",
            message: firstError.message,
          },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { feedback } = validationResult.data;

    // TODO: Here you would typically:
    // 1. Verify that the extraction log exists
    // 2. Store the feedback in the database
    // 3. Optionally use the feedback to improve AI model

    console.log(`Received feedback for extraction ${logId}: ${feedback}`);

    // For now, just return success
    return new Response(null, {
      status: 204,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in feedback endpoint:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
