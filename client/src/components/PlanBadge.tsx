export function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan?.toLowerCase() === "pro";

  return (
    <span
      style={{
        background: isPro ? "var(--accent-dim)" : "var(--bg-2)",
        border: `1px solid ${isPro ? "rgba(79,110,247,0.25)" : "var(--border)"}`,
        borderRadius: 4,
        color: isPro ? "var(--accent)" : "var(--text-3)",
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        padding: "2px 7px",
        textTransform: "uppercase",
      }}
    >
      {isPro ? "PRO" : "FREE"}
    </span>
  );
}
