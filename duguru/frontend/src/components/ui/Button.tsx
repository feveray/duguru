import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost:
    "rounded-full bg-transparent px-6 py-3 text-sm font-semibold text-[var(--color-paragraph)] transition-colors hover:bg-[var(--color-surface)] focus-visible:ring-2 focus-visible:ring-[var(--color-button)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "rounded-full bg-[var(--color-error)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const LoadingSpinner = () => (
  <svg
    className="mr-2 h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/**
 * Button — Botão primitivo do design system duGuru.
 *
 * Usa exclusivamente CSS custom properties para cores.
 * Suporta loading state, variantes e tamanhos.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const base = variantClasses[variant] ?? variantClasses.primary;
    const sizeOverride = size !== "md" ? sizeClasses[size] : "";
    const widthClass = fullWidth ? "w-full justify-center" : "";

    return (
      <button
        ref={ref}
        className={`inline-flex items-center ${base} ${sizeOverride} ${widthClass} ${className}`}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

/**
 * AnimatedButton — versão com animação Framer Motion de tap.
 */
type AnimatedButtonProps = ButtonProps & HTMLMotionProps<"button">;

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth = false, className = "", disabled, children, ...props }, ref) => {
    const base = variantClasses[variant] ?? variantClasses.primary;
    const sizeOverride = size !== "md" ? sizeClasses[size] : "";
    const widthClass = fullWidth ? "w-full justify-center" : "";

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center ${base} ${sizeOverride} ${widthClass} ${className}`}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </motion.button>
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";
