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
    danger: "btn-danger",
    ghost: "btn-ghost",
    primary: "btn-primary",
    secondary: "btn-secondary",
  };
  
  const sizes: Record<Size, string> = {
    lg: "btn-lg",
    md: "btn-md",
    sm: "btn-sm",
  };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} fill="none" height="16" viewBox="0 0 24 24" width="16">
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeDasharray="40 20"
            strokeWidth="3"
            opacity="0.3"
          />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}
