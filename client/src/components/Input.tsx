import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && (
          <label className="label" htmlFor={id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className="input"
          id={id}
          {...props}
        />
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
