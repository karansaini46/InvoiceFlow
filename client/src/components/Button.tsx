import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<Variant, string> = {
    danger:
      "border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-[#F87171] hover:bg-[rgba(239,68,68,0.25)]",
    primary: "glow-btn",
    secondary:
      "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
