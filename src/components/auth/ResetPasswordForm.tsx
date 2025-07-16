import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthErrorAlert } from "./AuthErrorAlert";

interface ResetPasswordFormProps {
  className?: string;
  token: string;
}

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export function ResetPasswordForm({ className, token }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    // Sprawdź czy token jest obecny i ważny
    if (!token) {
      setTokenError("Brak tokenu resetowania hasła. Link może być nieprawidłowy.");
      return;
    }

    // TODO: Walidacja tokenu z backendem
    // Możliwość sprawdzenia czy token nie wygasł
  }, [token]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Walidacja nowego hasła
    if (!formData.newPassword) {
      newErrors.newPassword = "Nowe hasło jest wymagane";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Hasło musi mieć co najmniej 8 znaków";
    }

    // Walidacja potwierdzenia hasła
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła muszą być identyczne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implementacja wywołania auth.service.resetPassword
      // console.log("Password reset attempt:", { token, newPassword: formData.newPassword });

      // Symulacja błędu lub sukcesu
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSuccess(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message?.includes("Token expired")) {
          setGlobalError("Token wygasł. Poproś o nowy link do resetowania hasła.");
        } else if (error.message?.includes("Invalid token")) {
          setGlobalError("Nieprawidłowy token. Link może być uszkodzony.");
        } else {
          setGlobalError("Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.");
        }
      } else {
        setGlobalError("Wystąpił nieznany błąd. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ResetPasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Wyczyść błąd dla tego pola
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Jeśli resetowanie się powiodło, pokaż komunikat sukcesu
  if (isSuccess) {
    return (
      <Card className={className} data-testid="reset-password-success">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Hasło zmienione!</CardTitle>
          <CardDescription>Twoje hasło zostało pomyślnie zaktualizowane</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Możesz teraz zalogować się używając nowego hasła.</p>
          <Button asChild className="w-full">
            <a href="/auth/login">Przejdź do logowania</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Jeśli wystąpił błąd z tokenem, pokaż odpowiedni komunikat
  if (tokenError) {
    return (
      <Card className={className} data-testid="reset-password-token-error">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-destructive">Problem z linkiem</CardTitle>
          <CardDescription>{tokenError}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline" asChild className="w-full mb-4">
            <a href="/auth/reset">Poproś o nowy link</a>
          </Button>
          <Button variant="link" asChild className="p-0 h-auto">
            <a href="/auth/login">Powrót do logowania</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="reset-password-form">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthErrorAlert error={globalError} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="reset-password-form-element" noValidate>
          <FloatingInput
            type="password"
            label="Nowe hasło"
            value={formData.newPassword}
            onChange={handleChange("newPassword")}
            error={errors.newPassword}
            disabled={isLoading}
            data-testid="reset-password-new-password-input"
            helperText="Co najmniej 8 znaków"
          />

          <FloatingInput
            type="password"
            label="Potwierdź nowe hasło"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={errors.confirmPassword}
            disabled={isLoading}
            data-testid="reset-password-confirm-password-input"
            helperText="Wprowadź hasło ponownie"
          />

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="reset-password-submit-button">
            {isLoading ? "Zmienianie hasła..." : "Zmień hasło"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" asChild className="p-0 h-auto" data-testid="reset-password-login-link">
            <a href="/auth/login">Powrót do logowania</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
