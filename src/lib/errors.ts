/**
 * Custom Error class for API-related errors.
 *
 * @example
 * if (!user) {
 *   throw new ApiError(401, "Authentication is required.", "AUTH_REQUIRED");
 * }
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string | undefined;

  /**
   * @param statusCode - HTTP status code to be returned to the client.
   * @param message - Developer-facing error message (can be logged).
   * @param errorCode - Optional, client-facing code (e.g., "INVALID_INPUT").
   */
  constructor(statusCode: number, message: string, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // necessary for custom errors in TypeScript to work correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
