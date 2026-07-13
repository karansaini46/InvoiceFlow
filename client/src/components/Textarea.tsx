import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && (
          <label className="label" htmlFor={id}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className="textarea"
          id={id}
          {...props}
        />
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
