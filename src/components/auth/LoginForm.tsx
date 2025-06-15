import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { authService } from "@/lib/services/auth.service";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth.validation";
import { z } from "zod";

interface LoginFormProps {
  className?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email" || err.path[0] === "password") {
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
      const result = await authService.login(formData);

      if (result.error) {
        setGlobalError(result.error);
        return;
      }

      if (result.success) {
        // Po udanym logowaniu przekieruj do /recipes
        window.location.href = result.redirectTo || "/recipes";
      }
    } catch {
      setGlobalError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <Card className={className} data-testid="login-form">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby uzyskać dostęp do konta</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthErrorAlert error={globalError} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form-element" noValidate>
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
              data-testid="login-email-input"
            />
            {errors.email && (
              <p className="text-sm text-destructive" data-testid="login-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="Wprowadź hasło"
              value={formData.password}
              onChange={handleChange("password")}
              aria-invalid={!!errors.password}
              disabled={isLoading}
              data-testid="login-password-input"
            />
            {errors.password && (
              <p className="text-sm text-destructive" data-testid="login-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-submit-button">
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button variant="link" asChild data-testid="login-forgot-password-link">
            <a href="/auth/reset">Zapomniałeś hasła?</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
