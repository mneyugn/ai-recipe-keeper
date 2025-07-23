import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "../register";
import { ApiError } from "../../../../lib/errors";

// mock dependencies
vi.mock("../../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

vi.mock("../../../../lib/validations/auth.validation", () => ({
  registerSchema: {
    safeParse: vi.fn(),
  },
}));

import { createSupabaseServerInstance } from "../../../../db/supabase.client";
import { registerSchema } from "../../../../lib/validations/auth.validation";

const mockCreateSupabaseServerInstance = vi.mocked(createSupabaseServerInstance);
const mockRegisterSchema = vi.mocked(registerSchema);

describe("POST /api/auth/register", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signUp: vi.fn(),
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

  test("successfully registers a new user with auto-login", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    const userData = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
      session: { access_token: "token-123" },
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
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
      message: "Account created successfully.",
    });
    expect(mockRegisterSchema.safeParse).toHaveBeenCalledWith(registerData);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  test("successfully registers a user who needs to confirm their email", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    const userData = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
      session: null, // No session means email confirmation is needed
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
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
      message: "Please check your inbox and confirm your email address to complete registration.",
      redirectTo: "/auth/login",
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    });
  });

  test("throws a validation error for invalid data", async () => {
    // Arrange
    const invalidData = {
      email: "invalid-email",
      password: "password123",
      confirmPassword: "different123",
    };

    mockContext.request.json.mockResolvedValue(invalidData);
    const zodError = {
      success: false as const,
      error: {
        errors: [{ message: "Invalid email format" }, { message: "Passwords must match" }],
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRegisterSchema.safeParse.mockReturnValue(zodError as any);

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Invalid email format, Passwords must match", "VALIDATION_ERROR")
    );
  });

  test("throws an error for an existing email", async () => {
    // Arrange
    const registerData = {
      email: "existing@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "A user with this email address already exists.", "USER_ALREADY_EXISTS")
    );
  });

  test("throws an error for a password that is too short", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Password should be at least 6 characters" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Password must be at least 6 characters long.", "PASSWORD_TOO_SHORT")
    );
  });

  test("throws an error for an invalid email format", async () => {
    // Arrange
    const registerData = {
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Unable to validate email address" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Invalid email address format.", "INVALID_EMAIL")
    );
  });

  test("throws an error when registration is disabled", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Signup is disabled" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Registration is currently disabled.", "SIGNUP_DISABLED")
    );
  });

  test("throws an error when user data is not returned", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "Could not create account.", "ACCOUNT_CREATION_FAILED")
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
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Unknown Supabase error" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "An error occurred during registration.", "REGISTRATION_FAILED")
    );
  });

  test("calls createSupabaseServerInstance with correct parameters", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
        session: { access_token: "token-123" },
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

  test("does not pass confirmPassword to Supabase", async () => {
    // Arrange
    const registerData = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    mockContext.request.json.mockResolvedValue(registerData);
    mockRegisterSchema.safeParse.mockReturnValue({
      success: true,
      data: registerData,
    });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
        session: { access_token: "token-123" },
      },
      error: null,
    });

    // Act
    await POST(mockContext);

    // Assert
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalledWith(
      expect.objectContaining({
        confirmPassword: expect.any(String),
      })
    );
  });
});
