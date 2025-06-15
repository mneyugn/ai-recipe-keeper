import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "../login";

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

  test("pomyślnie loguje użytkownika z poprawnymi danymi", async () => {
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

  test("zwraca błąd walidacji dla nieprawidłowych danych", async () => {
    // Arrange
    const invalidData = {
      email: "invalid-email",
      password: "",
    };

    const zodError = {
      success: false,
      error: {
        errors: [{ message: "Nieprawidłowy format email" }, { message: "Hasło jest wymagane" }],
      },
    };

    mockContext.request.json.mockResolvedValue(invalidData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLoginSchema.safeParse.mockReturnValue(zodError as any);

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Nieprawidłowy format email, Hasło jest wymagane",
    });
  });

  test("zwraca błąd dla nieprawidłowych danych logowania", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Nieprawidłowy email lub hasło",
    });
  });

  test("zwraca błąd dla niepotwierdzonego emaila", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Potwierdź swój adres email przed logowaniem",
    });
  });

  test("zwraca błąd dla zbyt wielu prób logowania", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Zbyt wiele prób logowania. Spróbuj ponownie później",
    });
  });

  test("zwraca błąd gdy nie ma danych użytkownika", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Nie udało się zalogować",
    });
  });

  test("zwraca błąd serwera dla nieoczekiwanych błędów", async () => {
    // Arrange
    mockContext.request.json.mockRejectedValue(new Error("Unexpected error"));

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(result).toEqual({
      error: "Wystąpił błąd serwera",
    });
  });

  test("zwraca domyślny błąd Supabase dla nieznanych błędów", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Wystąpił błąd podczas logowania",
    });
  });

  test("wywołuje createSupabaseServerInstance z poprawnymi parametrami", async () => {
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
