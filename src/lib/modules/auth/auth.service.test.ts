import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { container } from "tsyringe";
import { AuthService } from "./auth.service";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { APIContext } from "astro";
import { ApiError } from "../../errors";

// Mock SupabaseClient
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();

    // Register the mock Supabase client
    container.registerInstance("SupabaseClient", mockSupabase as unknown as SupabaseClient);

    // Resolve the AuthService instance from the container
    authService = container.resolve(AuthService);
  });

  // --- Login Tests ---
  describe("login", () => {
    it("should login a user successfully and set cookies", async () => {
      // Arrange
      const mockContext = {
        cookies: {
          set: vi.fn(),
        },
        url: new URL("https://test.com"),
      } as unknown as APIContext;

      const mockSession = { access_token: "test_access", refresh_token: "test_refresh" };
      const mockUser = { id: "123", email: "test@example.com" };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      const response = await authService.login(mockContext, {
        email: "test@example.com",
        password: "password123",
      });
      const responseBody = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseBody.user.email).toBe("test@example.com");
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockContext.cookies.set).toHaveBeenCalledWith(
        mockSession.access_token,
        mockSession.refresh_token,
        expect.any(Object)
      );
    });

    it("should throw ApiError for invalid credentials", async () => {
      // Arrange
      const mockContext = {} as APIContext;
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", name: "AuthApiError", status: 400 },
      });

      // Act & Assert
      const loginPromise = authService.login(mockContext, { email: "test@example.com", password: "wrongpassword" });
      await expect(loginPromise).rejects.toThrow(
        new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS")
      );
    });
  });

  // --- Register Tests ---
  describe("register", () => {
    it("should register a new user and return success message for email confirmation", async () => {
      // Arrange
      const mockContext = {} as APIContext;
      const mockUser = { id: "456", email: "new@example.com" };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null }, // No session means email confirmation is needed
        error: null,
      });

      // Act
      const response = await authService.register(mockContext, {
        email: "new@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      const responseBody = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseBody.message).toContain("Please check your inbox");
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "password123" });
    });

    it("should throw ApiError if user already exists", async () => {
      // Arrange
      const mockContext = {} as APIContext;
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered", name: "AuthApiError", status: 400 },
      });

      // Act & Assert
      const registerPromise = authService.register(mockContext, {
        email: "exists@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      await expect(registerPromise).rejects.toThrow(
        new ApiError(409, "A user with this email address already exists.", "USER_ALREADY_EXISTS")
      );
    });
  });

  // --- Logout Tests ---
  describe("logout", () => {
    it("should log out the user and clear cookies", async () => {
      // Arrange
      const mockContext = {
        cookies: {
          delete: vi.fn(),
        },
      } as unknown as APIContext;
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const response = await authService.logout(mockContext);
      const responseBody = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseBody.message).toBe("You have been logged out.");
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockContext.cookies.delete).toHaveBeenCalledTimes(2);
    });
  });
});
