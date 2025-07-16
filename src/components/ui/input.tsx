import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  id?: string;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Enhanced Input with Floating Labels
export interface FloatingInputProps extends Omit<InputProps, "placeholder"> {
  label: string;
  error?: string;
  helperText?: string;
  "data-testid"?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || `floating-input-${generatedId}`;

    // Check if input has value
    React.useEffect(() => {
      setHasValue(!!props.value);
    }, [props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const isFloating = isFocused || hasValue;

    return (
      <div className="relative animate-scale-in">
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "peer w-full h-12 px-3 pt-6 pb-2 rounded-md border border-input bg-background text-foreground",
            "shadow-xs transition-all duration-200 transform-gpu",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50",
            "focus-visible:scale-[1.01] focus-visible:animate-gentle-bounce",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "placeholder:transparent", // Hide placeholder to use floating label
            error &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 animate-gentle-bounce",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Enhanced Floating Label with micro-animations */}
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 text-muted-foreground pointer-events-none transition-all duration-200 transform-gpu",
            isFloating ? "top-2 text-xs font-medium scale-90" : "top-1/2 -translate-y-1/2 text-sm scale-100",
            isFocused && "text-primary animate-gentle-bounce",
            error && "text-destructive"
          )}
        >
          {label}
        </label>

        {/* Enhanced Error Message with slide animation */}
        {error && (
          <p
            className="text-sm text-destructive mt-1 animate-slide-in-right"
            data-testid={props["data-testid"]?.replace("-input", "-error")}
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && <p className="text-sm text-muted-foreground mt-1 animate-fade-in-up">{helperText}</p>}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { Input, FloatingInput };
