import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && (
          <label className="label" htmlFor={id}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className="select"
          id={id}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
