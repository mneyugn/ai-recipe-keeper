import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import type { APIContext } from "astro";
import type { SupabaseClient } from "../../../db/supabase.client";
import {
  type LoginFormData,
  type RegisterFormData,
  loginSchema,
  registerSchema,
} from "../../validations/auth.validation";
import { ApiError } from "../../errors";
import { fromZodError } from "zod-validation-error";
import { created, success } from "../../api/responses";

export interface IAuthService {
  login(context: APIContext, data: LoginFormData): Promise<Response>;
  register(context: APIContext, data: RegisterFormData): Promise<Response>;
  logout(context: APIContext): Promise<Response>;
}

@injectable()
export class AuthService implements IAuthService {
  constructor(@inject("SupabaseClient") private supabase: SupabaseClient) {}

  public async login(context: APIContext, data: LoginFormData): Promise<Response> {
    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      throw new ApiError(400, validationError.message, "VALIDATION_ERROR", validationError.details);
    }
    const { email, password } = validationResult.data;

    const { data: authData, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error || !authData.user || !authData.session) {
      throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const { access_token, refresh_token } = authData.session;
    context.cookies.set(access_token, refresh_token, {
      httpOnly: true,
      secure: context.url.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return success({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      redirectTo: "/recipes",
    });
  }

  public async register(_context: APIContext, data: RegisterFormData): Promise<Response> {
    const validationResult = registerSchema.safeParse(data);
    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      throw new ApiError(400, validationError.message, "VALIDATION_ERROR", validationError.details);
    }

    const { email, password } = validationResult.data;

    const { data: authData, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        throw new ApiError(409, "A user with this email address already exists.", "USER_ALREADY_EXISTS");
      }
      throw new ApiError(500, error.message, "SUPABASE_ERROR");
    }

    if (!authData.user) {
      throw new ApiError(500, "Could not create account.", "ACCOUNT_CREATION_FAILED");
    }

    // User needs to confirm their email
    if (authData.user && !authData.session) {
      return created({
        message: "Please check your inbox and confirm your email address to complete registration.",
        redirectTo: "/auth/login",
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      });
    }

    // Automatic login after registration
    return created({
      message: "Account created successfully.",
      redirectTo: "/recipes",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  }

  public async logout(context: APIContext): Promise<Response> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new ApiError(500, error.message, "SUPABASE_ERROR");
    }

    context.cookies.delete("sb-access-token", { path: "/" });
    context.cookies.delete("sb-refresh-token", { path: "/" });

    return success({
      message: "You have been logged out.",
      redirectTo: "/auth/login",
    });
  }
}
