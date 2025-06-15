import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST } from "../register";

// Mock dependencies
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

  test("pomyślnie rejestruje nowego użytkownika z automatycznym logowaniem", async () => {
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
      message: "Konto zostało utworzone pomyślnie",
    });
    expect(mockRegisterSchema.safeParse).toHaveBeenCalledWith(registerData);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  test("pomyślnie rejestruje użytkownika z koniecznością potwierdzenia email", async () => {
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
      session: null, // Brak sesji oznacza konieczność potwierdzenia email
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
      message: "Sprawdź swoją skrzynkę email i potwierdź adres, aby dokończyć rejestrację",
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    });
  });

  test("zwraca błąd walidacji dla nieprawidłowych danych", async () => {
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
        errors: [{ message: "Nieprawidłowy format email" }, { message: "Hasła muszą być identyczne" }],
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRegisterSchema.safeParse.mockReturnValue(zodError as any);

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Nieprawidłowy format email, Hasła muszą być identyczne",
    });
  });

  test("zwraca błąd dla zajętego adresu email", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Użytkownik z tym adresem email już istnieje",
    });
  });

  test("zwraca błąd dla zbyt krótkiego hasła", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Hasło musi mieć co najmniej 6 znaków",
    });
  });

  test("zwraca błąd dla nieprawidłowego formatu emaila", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Nieprawidłowy format adresu email",
    });
  });

  test("zwraca błąd gdy rejestracja jest wyłączona", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Rejestracja jest obecnie wyłączona",
    });
  });

  test("zwraca błąd gdy nie ma danych użytkownika", async () => {
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Nie udało się utworzyć konta",
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

    // Act
    const response = await POST(mockContext);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(result).toEqual({
      error: "Wystąpił błąd podczas rejestracji",
    });
  });

  test("wywołuje createSupabaseServerInstance z poprawnymi parametrami", async () => {
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

  test("nie przekazuje confirmPassword do Supabase", async () => {
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
