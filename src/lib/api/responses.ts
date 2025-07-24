import type { ErrorResponseDTO } from "../../types";

/**
 * Creates a standardized success response with the provided data
 *
 * @param data - The data payload to return to the client
 * @param status - HTTP status code (defaults to 200)
 * @returns Response object with JSON data and appropriate headers
 */
export function success<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized error response with the provided error details
 *
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code
 * @param errorCode - Application-specific error code
 * @param details - Optional structured error details (e.g., validation errors)
 * @returns Response object with standardized error format
 */
export function error(message: string, statusCode: number, errorCode: string, details?: unknown): Response {
  const errorBody: ErrorResponseDTO = {
    error: {
      code: errorCode,
      message,
      ...(details ? { details: details as Record<string, string> } : {}),
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a success response for created resources (HTTP 201)
 *
 * @param data - The created resource data
 * @returns Response object with 201 status
 */
export function created<T>(data: T): Response {
  return success(data, 201);
}

/**
 * Creates a success response with no content (HTTP 204)
 *
 * @returns Response object with 204 status and no body
 */
export function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a not found error response (HTTP 404)
 *
 * @param resource - Name of the resource that was not found
 * @returns Response object with 404 status and standardized error
 */
export function notFound(resource = "Resource"): Response {
  return error(`${resource} not found`, 404, "NOT_FOUND");
}

/**
 * Creates an unauthorized error response (HTTP 401)
 *
 * @param message - Optional custom message (defaults to generic message)
 * @returns Response object with 401 status and standardized error
 */
export function unauthorized(message = "Authentication required"): Response {
  return error(message, 401, "UNAUTHORIZED");
}

/**
 * Creates a forbidden error response (HTTP 403)
 *
 * @param message - Optional custom message (defaults to generic message)
 * @returns Response object with 403 status and standardized error
 */
export function forbidden(message = "Access denied"): Response {
  return error(message, 403, "FORBIDDEN");
}

/**
 * Creates a validation error response (HTTP 400)
 *
 * @param message - Error message
 * @param details - Validation error details
 * @returns Response object with 400 status and validation error format
 */
export function validationError(message: string, details?: unknown): Response {
  return error(message, 400, "VALIDATION_ERROR", details);
}
