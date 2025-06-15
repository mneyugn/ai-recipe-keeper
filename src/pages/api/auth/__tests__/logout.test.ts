import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "../logout";

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

  test("pomyślnie wylogowuje użytkownika", async () => {
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
      message: "Zostałeś wylogowany",
      redirectTo: "/auth/login",
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test("zwraca błąd gdy wylogowanie się nie powiedzie", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: "Logout failed" },
    });

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Wystąpił błąd podczas wylogowania",
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test("zwraca błąd serwera dla nieoczekiwanych błędów", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockRejectedValue(new Error("Unexpected error"));

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(result).toEqual({
      error: "Wystąpił błąd serwera",
    });
  });

  test("wywołuje createSupabaseServerInstance z poprawnymi parametrami", async () => {
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

  test("obsługuje przypadek gdy Supabase zwraca null error ale nie signOut poprawnie", async () => {
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
    expect(result.message).toBe("Zostałeś wylogowany");
    expect(result.redirectTo).toBe("/auth/login");
  });

  test("wywołuje signOut bez parametrów", async () => {
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

  test("loguje błędy do konsoli", async () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Test error");
    mockSupabase.auth.signOut.mockRejectedValue(error);

    // Act
    await POST(mockContext);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith("Logout API error:", error);

    // Cleanup
    consoleSpy.mockRestore();
  });

  test("zwraca poprawne nagłówki Content-Type", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    // Act
    const response = await POST(mockContext);

    // Assert
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  test("zwraca błąd z poprawnym nagłówkiem dla błędów wylogowania", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: "Some logout error" },
    });

    // Act
    const response = await POST(mockContext);

    // Assert
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  test("zwraca błąd serwera z poprawnym nagłówkiem dla wyjątków", async () => {
    // Arrange
    mockSupabase.auth.signOut.mockRejectedValue(new Error("Server error"));

    // Act
    const response = await POST(mockContext);

    // Assert
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});
