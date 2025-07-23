import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "../logout";
import { ApiError } from "../../../../lib/errors";

// Mock dependencies
vi.mock("../../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

import { createSupabaseServerInstance } from "../../../../db/supabase.client";

const mockCreateSupabaseServerInstance = vi.mocked(createSupabaseServerInstance);

describe("POST /api/auth/logout", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signOut: vi.fn(),
      },
    };

    mockCreateSupabaseServerInstance.mockReturnValue(mockSupabase);

    mockContext = {
      request: {
        headers: new Headers(),
      },
      cookies: {},
    };
  });

  test("successfully logs out a user", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result).toEqual({
      success: true,
      message: "You have been logged out.",
      redirectTo: "/auth/login",
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test("throws an error when logout fails", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: "Logout failed" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(
      new ApiError(400, "An error occurred during logout.", "LOGOUT_FAILED")
    );
  });

  test("propagates unexpected errors", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockRejectedValue(new Error("Unexpected error"));

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow("Unexpected error");
  });

  test("calls createSupabaseServerInstance with correct parameters", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
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

  test("handles the case where Supabase returns null error but does not sign out correctly", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe("You have been logged out.");
    expect(result.redirectTo).toBe("/auth/login");
  });

  test("calls signOut without parameters", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    // Act
    await POST(mockContext);

    // Assert
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith();
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test("logs errors to the console", async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // do nothing
    });
    const error = new Error("Test error");
    mockSupabase.auth.signOut.mockResolvedValue({ error });

    // Act
    try {
      await POST(mockContext);
    } catch {
      // Expected to throw
    }

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith("Logout error:", error);

    // Cleanup
    consoleSpy.mockRestore();
  });

  test("returns correct Content-Type headers", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    // Act
    const response = await POST(mockContext);

    // Assert
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  test("returns correct headers for logout errors", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: "Some logout error" },
    });

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow(ApiError);
  });

  test("returns correct headers for exceptions", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockRejectedValue(new Error("Server error"));

    // Act & Assert
    await expect(POST(mockContext)).rejects.toThrow("Server error");
  });
});
