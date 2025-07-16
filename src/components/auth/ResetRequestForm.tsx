import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthErrorAlert } from "./AuthErrorAlert";

interface ResetRequestFormProps {
  className?: string;
}

interface ResetRequestFormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

export function ResetRequestForm({ className }: ResetRequestFormProps) {
  const [formData, setFormData] = useState<ResetRequestFormData>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Walidacja email
    if (!formData.email) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Nieprawidłowy format email";
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
      // TODO: Implementacja wywołania auth.service.requestReset
      //   console.log("Reset request attempt:", formData);

      // Symulacja błędu lub sukcesu
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSuccess(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message?.includes("User not found")) {
          setGlobalError("Nie znaleziono konta z tym adresem email");
        } else {
          setGlobalError("Wystąpił błąd podczas wysyłania linku. Spróbuj ponownie.");
        }
      } else {
        setGlobalError("Wystąpił nieznany błąd. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      email: e.target.value,
    });

    // Wyczyść błąd dla tego pola
    if (errors.email) {
      setErrors({});
    }
  };

  // Jeśli reset się powiódł, pokaż komunikat sukcesu
  if (isSuccess) {
    return (
      <Card className={className} data-testid="reset-request-success">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Email wysłany!</CardTitle>
          <CardDescription>
            Sprawdź swoją skrzynkę pocztową. Wysłaliśmy link do resetowania hasła na adres {formData.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Nie otrzymałeś wiadomości? Sprawdź folder spam lub spróbuj ponownie za kilka minut.
          </p>
          <Button variant="outline" onClick={() => setIsSuccess(false)} className="w-full">
            Spróbuj ponownie
          </Button>
          <div className="mt-4">
            <Button variant="link" asChild className="p-0 h-auto">
              <a href="/auth/login">Powrót do logowania</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="reset-request-form">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
        <CardDescription>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthErrorAlert error={globalError} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="reset-request-form-element" noValidate>
          <FloatingInput
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
            data-testid="reset-request-email-input"
            helperText="Adres email używany do rejestracji"
          />

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="reset-request-submit-button">
            {isLoading ? "Wysyłanie..." : "Wyślij link do resetowania"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pamiętasz hasło?{" "}
            <Button variant="link" asChild className="p-0 h-auto" data-testid="reset-request-login-link">
              <a href="/auth/login">Zaloguj się</a>
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
