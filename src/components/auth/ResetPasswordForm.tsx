import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ResetPasswordFormProps {
  className?: string;
  token?: string;
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
      newErrors.confirmPassword = "Hasła nie są zgodne";
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
      // TODO: Implementacja wywołania auth.service.confirmReset
      console.log("Reset password attempt:", {
        token,
        newPassword: formData.newPassword,
      });

      // Symulacja błędu lub sukcesu
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSuccess(true);
    } catch (error: any) {
      if (error.message?.includes("invalid_token") || error.message?.includes("expired")) {
        setGlobalError("Link resetowania hasła wygasł lub jest nieprawidłowy. Wygeneruj nowy link.");
      } else {
        setGlobalError("Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.");
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

  // Wyświetl błąd tokenu
  if (tokenError) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-red-700">Link nieprawidłowy</CardTitle>
          <CardDescription>Problem z linkiem resetowania hasła</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{tokenError}</AlertDescription>
          </Alert>

          <div className="mt-6 text-center space-y-2">
            <Button asChild className="w-full">
              <a href="/auth/reset">Wygeneruj nowy link</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/auth/login">Powrót do logowania</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Wyświetl komunikat sukcesu
  if (isSuccess) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-700">Hasło zmienione!</CardTitle>
          <CardDescription>Twoje hasło zostało pomyślnie zaktualizowane</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Możesz teraz zalogować się używając nowego hasła.</AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button asChild className="w-full">
              <a href="/auth/login">Przejdź do logowania</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthErrorAlert error={globalError} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Co najmniej 8 znaków"
              value={formData.newPassword}
              onChange={handleChange("newPassword")}
              aria-invalid={!!errors.newPassword}
              disabled={isLoading}
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Wprowadź hasło ponownie"
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Ustaw nowe hasło"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button variant="outline" asChild className="w-full">
            <a href="/auth/login">Anuluj</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
