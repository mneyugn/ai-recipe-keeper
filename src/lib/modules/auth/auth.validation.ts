import { z } from "zod";

// Login form validation
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
  password: z.string({ required_error: "Hasło jest wymagane" }).min(1, "Hasło jest wymagane"),
  //   .min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

// Register form validation
export const registerSchema = z
  .object({
    email: z
      .string({ required_error: "Email jest wymagany" })
      .min(1, "Email jest wymagany")
      .email("Nieprawidłowy format email"),
    password: z.string({ required_error: "Hasło jest wymagane" }).min(1, "Hasło jest wymagane"),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

// Reset password request validation
export const resetRequestSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
});

// Reset password confirm validation
export const resetConfirmSchema = z
  .object({
    token: z.string({ required_error: "Token jest wymagany" }).min(1, "Token jest wymagany"),
    newPassword: z
      .string({ required_error: "Nowe hasło jest wymagane" })
      .min(1, "Nowe hasło jest wymagane")
      .min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

// TypeScript types derived from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetRequestFormData = z.infer<typeof resetRequestSchema>;
export type ResetConfirmFormData = z.infer<typeof resetConfirmSchema>;
