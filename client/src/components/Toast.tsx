type ToastType = "success" | "error" | "info";

const icons: Record<ToastType, string> = {
  error: "✕",
  info: "·",
  success: "✓",
};

const colors: Record<ToastType, string> = {
  error: "var(--red)",
  info: "var(--accent)",
  success: "var(--green)",
};

export function Toast({
  message,
  type = "success",
  onDismiss,
}: {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        animation: "fadeIn 200ms ease both",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        bottom: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        color: "var(--text-1)",
        display: "flex",
        alignItems: "center",
        fontSize: 13,
        gap: 10,
        maxWidth: 340,
        padding: "10px 14px",
        position: "fixed",
        right: 20,
        zIndex: 99,
      }}
    >
      <span style={{ color: colors[type], fontSize: 14, fontWeight: 600 }}>{icons[type]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-3)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
        }}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
