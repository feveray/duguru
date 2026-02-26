import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  hint?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Input — Campo de texto primitivo do design system duGuru.
 *
 * Usa exclusivamente CSS custom properties para cores.
 * Inclui label, mensagem de erro e dica acessíveis.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAdornment,
      rightAdornment,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;

    const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={`${fullWidth ? "w-full" : ""} flex flex-col gap-1`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-headline)]"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--color-error)]" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAdornment && (
            <span className="pointer-events-none absolute left-3 text-[var(--color-paragraph)]">
              {leftAdornment}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              "input-base",
              leftAdornment ? "pl-10" : "",
              rightAdornment ? "pr-10" : "",
              error
                ? "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
                : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            {...props}
          />

          {rightAdornment && (
            <span className="absolute right-3 text-[var(--color-paragraph)]">
              {rightAdornment}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--color-paragraph)]">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-[var(--color-error)]"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
