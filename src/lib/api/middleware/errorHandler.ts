import { ApiError } from "../../errors";
import { error as createErrorResponse } from "../responses";

/**
 * Centralized error handler for API routes
 * Converts thrown errors into standardized JSON responses
 *
 * @param error - The error that was thrown (ApiError or generic Error)
 * @returns Response object with appropriate status and error details
 */
export function errorHandler(error: unknown): Response {
  // Log the full error for debugging purposes (in development/staging)
  console.error("API Error occurred:", error);

  // Handle known ApiError instances
  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.statusCode, error.errorCode || "API_ERROR", error.details);
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    // Log the full error details for debugging
    console.error("Unexpected error in API:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return createErrorResponse("An unexpected error occurred. Please try again later.", 500, "INTERNAL_SERVER_ERROR");
  }

  // Handle non-Error objects (should be rare)
  console.error("Non-Error object thrown:", error);

  return createErrorResponse("An unknown error occurred. Please try again later.", 500, "UNKNOWN_ERROR");
}

/**
 * Wrapper function for API route handlers that provides automatic error handling
 *
 * @param handler - The async function that handles the API request
 * @returns Wrapped handler with error handling
 */
export function withErrorHandler(handler: (request: Request, context?: unknown) => Promise<Response>) {
  return async (request: Request, context?: unknown): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorHandler(error);
    }
  };
}
