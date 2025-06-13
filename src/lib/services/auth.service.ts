// Auth service - API wrapper używany przez komponenty React
import type {
  LoginFormData,
  RegisterFormData,
  ResetRequestFormData,
  ResetConfirmFormData,
} from "../validations/auth.validation";

interface AuthResponse {
  success?: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string;
  };
  redirectTo?: string;
  message?: string;
}

async function fetchJson(url: string, data?: unknown): Promise<AuthResponse> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok && response.status === 401) {
      // Automatyczne przekierowanie na 401 - sesja wygasła
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      throw error;
    }
    throw new Error("Błąd połączenia z serwerem");
  }
}

export const authService = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    return fetchJson("/api/auth/login", credentials);
  },

  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    return fetchJson("/api/auth/register", data);
  },

  requestReset: async (data: ResetRequestFormData): Promise<AuthResponse> => {
    return fetchJson("/api/auth/reset", data);
  },

  confirmReset: async (data: ResetConfirmFormData): Promise<AuthResponse> => {
    return fetchJson("/api/auth/reset-confirm", data);
  },

  logout: async (): Promise<AuthResponse> => {
    return fetchJson("/api/auth/logout");
  },
};
