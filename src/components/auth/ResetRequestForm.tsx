import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { CheckCircle, Mail } from "lucide-react";

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
      console.log("Reset request attempt:", formData);

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

  // Wyświetl komunikat sukcesu
  if (isSuccess) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-700">Link wysłany!</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę odbiorczą</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Wysłaliśmy link do resetowania hasła na adres <strong>{formData.email}</strong>. Sprawdź również folder ze
              spamem, jeśli nie widzisz wiadomości w skrzynce odbiorczej.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center space-y-2">
            <Button variant="outline" asChild className="w-full">
              <a href="/auth/login">Powrót do logowania</a>
            </Button>
            <Button variant="ghost" onClick={() => setIsSuccess(false)} className="w-full">
              Wyślij link ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
        <CardDescription>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthErrorAlert error={globalError} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nazwa@przykład.pl"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link do resetowania"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Pamiętasz hasło?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <a href="/auth/login">Zaloguj się</a>
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
