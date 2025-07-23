import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "../login";
import { ApiError } from "../../../../lib/errors";

// Mock dependencies
vi.mock("../../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

vi.mock("../../../../lib/validations/auth.validation", () => ({
  loginSchema: {
    safeParse: vi.fn(),
  },
}));

import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { loginSchema } from "../../../../lib/validations/auth.validation";

const mockCreateSupabaseServerInstance = vi.mocked(createSupabaseServerInstance);
const mockLoginSchema = vi.mocked(loginSchema);

describe("POST /api/auth/login", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
      },
    };

    mockCreateSupabaseServerInstance.mockReturnValue(mockSupabase);

    mockContext = {
      request: {
        json: vi.fn(),
        headers: new Headers(),
      },
      cookies: {},
    };
  });

  test("successfully logs in a user with correct credentials", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    const userData = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
      session: { access_token: "token-123" },
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: userData,
      error: null,
    });

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result).toEqual({
      success: true,
      user: {
        id: "user-123",
        email: "test@example.com",
      },
      redirectTo: "/recipes",
    });
    expect(mockLoginSchema.safeParse).toHaveBeenCalledWith(loginData);
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  test("throws validation error for invalid data", async () => {
    // Arrange
    const invalidData = {
      email: "invalid-email",
      password: "",
    };

    const zodError = {
      success: false as const,
      error: {
        errors: [{ message: "Invalid email format" }, { message: "Password is required" }],
      },
    };

    mockContext.request.json.mockResolvedValue(invalidData);
    // @ts-expect-error - mockLoginSchema is mocked
    mockLoginSchema.safeParse.mockReturnValue(zodError);

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Invalid email format, Password is required", "VALIDATION_ERROR")
    );
  });

  test("throws an error for invalid login credentials", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Invalid email or password.", "INVALID_CREDENTIALS")
    );
  });

  test("throws an error for an unconfirmed email", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Email not confirmed" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Please confirm your email address before logging in.", "EMAIL_NOT_CONFIRMED")
    );
  });

  test("throws an error for too many login attempts", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Too many requests" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Too many login attempts. Please try again later.", "TOO_MANY_REQUESTS")
    );
  });

  test("throws an error when user data is not returned", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Login failed. User data not found.", "LOGIN_FAILED")
    );
  });

  test("propagates unexpected errors", async () => {
    // Arrange
    mockContext.request.json.mockRejectedValue(new Error("Unexpected error"));

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow("Unexpected error");
  });

  test("throws a generic error for unknown Supabase errors", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Unknown Supabase error" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "An error occurred during login.", "LOGIN_FAILED")
    );
  });

  test("calls createSupabaseServerInstance with correct parameters", async () => {
    // Arrange
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    mockContext.request.json.mockResolvedValue(loginData);
    mockLoginSchema.safeParse.mockReturnValue({
      success: true,
      data: loginData,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
      },
      error: null,
    });

    // Act
    await POST(mockContext);

    // Assert
    expect(mockCreateSupabaseServerInstance).toHaveBeenCalledWith({
      cookies: mockContext.cookies,
      headers: mockContext.request.headers,
    });
  });
});
