import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <h3 style={{ color: "var(--text-1)", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={`btn btn-sm ${destructive ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
