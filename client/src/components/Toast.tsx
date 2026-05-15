type ToastProps = {
  message: string;
  onDismiss: () => void;
  tone?: "success" | "error";
};

const toneClasses = {
  success: "var(--success)",
  error: "#F87171",
};

export function Toast({ message, onDismiss, tone = "success" }: ToastProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-fade-in-up"
      style={{
        alignItems: "center",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "0 0 40px rgba(99,102,241,0.2)",
        color: "var(--text-primary)",
        display: "flex",
        fontSize: 14,
        fontWeight: 500,
        gap: 12,
        maxWidth: 360,
        padding: "14px 20px",
      }}
    >
      <span style={{ color: toneClasses[tone], fontSize: 18 }}>{tone === "error" ? "!" : "✓"}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
        }}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
