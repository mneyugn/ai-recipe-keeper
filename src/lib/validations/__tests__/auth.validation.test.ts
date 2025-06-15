import { describe, test, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  resetRequestSchema,
  resetConfirmSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetRequestFormData,
  type ResetConfirmFormData,
} from "../auth.validation";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    test("akceptuje poprawne dane logowania", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test("odrzuca dane z pustym emailem", () => {
      const invalidData = {
        email: "",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Email jest wymagany");
      }
    });

    test("odrzuca dane z nieprawidłowym formatem emaila", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Nieprawidłowy format email");
      }
    });

    test("odrzuca dane z pustym hasłem", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Hasło jest wymagane");
      }
    });

    test("odrzuca dane z brakującymi polami", () => {
      const invalidData = {};

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(2);
        const errorMessages = result.error.errors.map((err) => err.message);
        expect(errorMessages).toContain("Email jest wymagany");
        expect(errorMessages).toContain("Hasło jest wymagane");
      }
    });
  });

  describe("registerSchema", () => {
    test("akceptuje poprawne dane rejestracji", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test("odrzuca dane z niepasującymi hasłami", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Hasła muszą być identyczne");
        expect(result.error.errors[0].path).toEqual(["confirmPassword"]);
      }
    });

    test("odrzuca dane z pustym emailem", () => {
      const invalidData = {
        email: "",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Email jest wymagany");
      }
    });

    test("odrzuca dane z nieprawidłowym formatem emaila", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Nieprawidłowy format email");
      }
    });

    test("odrzuca dane z pustym hasłem", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
        confirmPassword: "",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((err) => err.message === "Hasło jest wymagane")).toBe(true);
      }
    });

    test("odrzuca dane z pustym potwierdzeniem hasła", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((err) => err.message === "Potwierdzenie hasła jest wymagane")).toBe(true);
      }
    });

    test("odrzuca dane z brakującymi polami", () => {
      const invalidData = {};

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(3);
      }
    });
  });

  describe("resetRequestSchema", () => {
    test("akceptuje poprawny email do resetu hasła", () => {
      const validData = {
        email: "test@example.com",
      };

      const result = resetRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test("odrzuca pusty email", () => {
      const invalidData = {
        email: "",
      };

      const result = resetRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Pusty string jest traktowany jako nieprawidłowy format, nie jako brakujący
        expect(result.error.errors[0].message).toBe("Email jest wymagany");
      }
    });

    test("odrzuca nieprawidłowy format emaila", () => {
      const invalidData = {
        email: "invalid-email",
      };

      const result = resetRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Nieprawidłowy format email");
      }
    });

    test("odrzuca dane bez pola email", () => {
      const invalidData = {};

      const result = resetRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Email jest wymagany");
      }
    });
  });

  describe("resetConfirmSchema", () => {
    test("akceptuje poprawne dane do potwierdzenia resetu hasła", () => {
      const validData = {
        token: "valid-token-123",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123",
      };

      const result = resetConfirmSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test("odrzuca dane z niepasującymi hasłami", () => {
      const invalidData = {
        token: "valid-token-123",
        newPassword: "newPassword123",
        confirmPassword: "different123",
      };

      const result = resetConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Hasła muszą być identyczne");
      }
    });

    test("odrzuca dane z pustym tokenem", () => {
      const invalidData = {
        token: "",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123",
      };

      const result = resetConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message === "Token jest wymagany")).toBe(true);
      }
    });

    test("odrzuca hasło krótsze niż 8 znaków", () => {
      const invalidData = {
        token: "valid-token-123",
        newPassword: "short",
        confirmPassword: "short",
      };

      const result = resetConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message === "Hasło musi mieć co najmniej 8 znaków")).toBe(true);
      }
    });

    test("odrzuca dane z pustym nowym hasłem", () => {
      const invalidData = {
        token: "valid-token-123",
        newPassword: "",
        confirmPassword: "",
        // confirmPassword: "newPassword123",
      };

      const result = resetConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message === "Nowe hasło jest wymagane")).toBe(true);
      }
    });

    test("odrzuca dane z pustym potwierdzeniem hasła", () => {
      const invalidData = {
        token: "valid-token-123",
        newPassword: "newPassword123",
        confirmPassword: "",
      };

      const result = resetConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message === "Potwierdzenie hasła jest wymagane")).toBe(true);
      }
    });

    test("odrzuca dane z brakującymi polami", () => {
      const invalidData = {};

      const result = resetConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(3);
      }
    });
  });

  describe("TypeScript types", () => {
    test("LoginFormData type jest poprawny", () => {
      const data: LoginFormData = {
        email: "test@example.com",
        password: "password123",
      };
      expect(loginSchema.parse(data)).toEqual(data);
    });

    test("RegisterFormData type jest poprawny", () => {
      const data: RegisterFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };
      expect(registerSchema.parse(data)).toEqual(data);
    });

    test("ResetRequestFormData type jest poprawny", () => {
      const data: ResetRequestFormData = {
        email: "test@example.com",
      };
      expect(resetRequestSchema.parse(data)).toEqual(data);
    });

    test("ResetConfirmFormData type jest poprawny", () => {
      const data: ResetConfirmFormData = {
        token: "valid-token-123",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123",
      };
      expect(resetConfirmSchema.parse(data)).toEqual(data);
    });
  });
});
