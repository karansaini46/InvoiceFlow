import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger";
};

export function Button({ className = "", type = "button", variant = "default", ...props }: ButtonProps) {
  const baseClasses = "inline-flex w-fit items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  
  const variantClasses = variant === "danger" 
    ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    : "bg-slate-950 text-white hover:bg-slate-800 focus:ring-emerald-600";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      type={type}
      {...props}
    />
  );
}
