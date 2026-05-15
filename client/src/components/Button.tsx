import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const variants: Record<Variant, string> = {
    danger: "btn btn-danger",
    ghost: "btn btn-ghost",
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
  };
  const sizes: Record<Size, string> = {
    lg: "btn-lg",
    md: "",
    sm: "btn-sm",
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin" fill="none" height="13" viewBox="0 0 24 24" width="13">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeDasharray="40 20"
            strokeWidth="3"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
