import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { authService } from "@/lib/services/auth.service";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth.validation";
import { z } from "zod";

interface RegisterFormProps {
  className?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterForm({ className }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email" || err.path[0] === "password" || err.path[0] === "confirmPassword") {
            newErrors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register(formData);

      if (result.error) {
        setGlobalError(result.error);
        return;
      }

      if (result.success) {
        if (result.message) {
          // Pokazujemy komunikat o potwierdzeniu email jeśli potrzeba
          setGlobalError(null);
          // Można dodać komponente sukcesu tutaj
          alert(result.message);
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          }
        } else {
          // Przekierowanie bezpośrednio po sukcesie
          window.location.href = result.redirectTo || "/recipes";
        }
      }
    } catch {
      setGlobalError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <Card className={className} data-testid="register-form">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Załóż konto</CardTitle>
        <CardDescription>Utwórz nowe konto, aby rozpocząć korzystanie z AI RecipeKeeper</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthErrorAlert error={globalError} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form-element" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nazwa@przykład.pl"
              value={formData.email}
              onChange={handleChange("email")}
              aria-invalid={!!errors.email}
              disabled={isLoading}
              data-testid="register-email-input"
            />
            {errors.email && (
              <p className="text-sm text-destructive" data-testid="register-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="Co najmniej 8 znaków"
              value={formData.password}
              onChange={handleChange("password")}
              aria-invalid={!!errors.password}
              disabled={isLoading}
              data-testid="register-password-input"
            />
            {errors.password && (
              <p className="text-sm text-destructive" data-testid="register-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Wprowadź hasło ponownie"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              disabled={isLoading}
              data-testid="register-confirm-password-input"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive" data-testid="register-confirm-password-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="register-submit-button">
            {isLoading ? "Tworzenie konta..." : "Załóż konto"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Button variant="link" asChild className="p-0 h-auto" data-testid="register-login-link">
              <a href="/auth/login">Zaloguj się</a>
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
