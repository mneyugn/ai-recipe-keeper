import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorAlertProps {
  error: string | null;
  className?: string;
}

export function AuthErrorAlert({ error, className }: AuthErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className} data-testid="auth-error-alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription data-testid="auth-error-message">{error}</AlertDescription>
    </Alert>
  );
}
