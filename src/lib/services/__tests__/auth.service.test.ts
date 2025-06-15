import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "../auth.service";
import type {
  LoginFormData,
  RegisterFormData,
  ResetRequestFormData,
  ResetConfirmFormData,
} from "../../validations/auth.validation";

// Mock fetch globalnie
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock window.location
const mockLocation = {
  href: "",
};
vi.stubGlobal("location", mockLocation);

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("login", () => {
    test("pomyślnie loguje użytkownika z poprawnymi danymi", async () => {
      // Arrange
      const loginData: LoginFormData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        success: true,
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        redirectTo: "/recipes",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });
      expect(result).toEqual(mockResponse);
    });

    test("zwraca błąd dla nieprawidłowych danych logowania", async () => {
      // Arrange
      const loginData: LoginFormData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const mockResponse = {
        error: "Nieprawidłowy email lub hasło",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    test("przekierowuje na /auth/login gdy otrzyma status 401", async () => {
      // Arrange
      const loginData: LoginFormData = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow("Unauthorized");
      expect(mockLocation.href).toBe("/auth/login");
    });

    test("rzuca błąd połączenia gdy fetch się nie powiedzie", async () => {
      // Arrange
      const loginData: LoginFormData = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow("Błąd połączenia z serwerem");
    });
  });

  describe("register", () => {
    test("pomyślnie rejestruje nowego użytkownika", async () => {
      // Arrange
      const registerData: RegisterFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const mockResponse = {
        success: true,
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        message: "Konto zostało utworzone pomyślnie",
        redirectTo: "/recipes",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });
      expect(result).toEqual(mockResponse);
    });

    test("zwraca błąd dla zajętego adresu email", async () => {
      // Arrange
      const registerData: RegisterFormData = {
        email: "existing@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const mockResponse = {
        error: "Użytkownik z tym adresem email już istnieje",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    test("zwraca komunikat o konieczności potwierdzenia email", async () => {
      // Arrange
      const registerData: RegisterFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const mockResponse = {
        success: true,
        message: "Sprawdź swoją skrzynkę email i potwierdź adres, aby dokończyć rejestrację",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result).toEqual(mockResponse);
    });
  });

  describe("requestReset", () => {
    test("pomyślnie wysyła żądanie resetu hasła", async () => {
      // Arrange
      const resetData: ResetRequestFormData = {
        email: "test@example.com",
      };

      const mockResponse = {
        success: true,
        message: "Link do resetu hasła został wysłany na podany adres email",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.requestReset(resetData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resetData),
      });
      expect(result).toEqual(mockResponse);
    });

    test("zwraca błąd dla nieistniejącego emaila", async () => {
      // Arrange
      const resetData: ResetRequestFormData = {
        email: "nonexistent@example.com",
      };

      const mockResponse = {
        error: "Nie znaleziono użytkownika z podanym adresem email",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.requestReset(resetData);

      // Assert
      expect(result).toEqual(mockResponse);
    });
  });

  describe("confirmReset", () => {
    test("pomyślnie resetuje hasło z poprawnym tokenem", async () => {
      // Arrange
      const confirmData: ResetConfirmFormData = {
        token: "valid-token-123",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123",
      };

      const mockResponse = {
        success: true,
        message: "Hasło zostało zmienione pomyślnie",
        redirectTo: "/auth/login",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.confirmReset(confirmData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/reset-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmData),
      });
      expect(result).toEqual(mockResponse);
    });

    test("zwraca błąd dla nieprawidłowego lub wygasłego tokenu", async () => {
      // Arrange
      const confirmData: ResetConfirmFormData = {
        token: "invalid-token",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123",
      };

      const mockResponse = {
        error: "Token resetu hasła jest nieprawidłowy lub wygasł",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.confirmReset(confirmData);

      // Assert
      expect(result).toEqual(mockResponse);
    });
  });

  describe("logout", () => {
    test("pomyślnie wylogowuje użytkownika", async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: "Zostałeś wylogowany",
        redirectTo: "/auth/login",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.logout();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    test("obsługuje błąd wylogowania", async () => {
      // Arrange
      const mockResponse = {
        error: "Wystąpił błąd podczas wylogowania",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await authService.logout();

      // Assert
      expect(result).toEqual(mockResponse);
    });
  });

  describe("fetchJson utility", () => {
    test("przekierowuje na /auth/login dla statusu 401", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Act & Assert
      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Unauthorized");
      expect(mockLocation.href).toBe("/auth/login");
    });

    test("rzuca błąd połączenia dla innych błędów fetch", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      // Act & Assert
      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Błąd połączenia z serwerem");
    });

    test("nie maskuje błędów Unauthorized", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Unauthorized"));

      // Act & Assert
      await expect(
        authService.login({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
