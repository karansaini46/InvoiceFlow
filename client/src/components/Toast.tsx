type ToastProps = {
  message: string;
  onDismiss: () => void;
  tone?: "success" | "error";
};

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function Toast({ message, onDismiss, tone = "success" }: ToastProps) {
  return (
    <div className={`fixed right-6 top-6 z-50 max-w-sm rounded-md border px-4 py-3 shadow-lg ${toneClasses[tone]}`}>
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-lg leading-none opacity-70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
