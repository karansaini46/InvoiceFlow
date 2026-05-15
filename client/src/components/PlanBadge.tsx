import type { HTMLAttributes } from "react";

import { normalizePlan } from "@/lib/plan";

type PlanBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  plan: string;
};

export function PlanBadge({ plan, className = "", ...props }: PlanBadgeProps) {
  const normalizedPlan = normalizePlan(plan);
  const isPro = normalizedPlan === "pro";

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{
        background: isPro
          ? "linear-gradient(135deg, var(--accent), var(--accent-cyan))"
          : "var(--bg-elevated)",
        border: isPro ? "none" : "1px solid var(--border)",
        borderRadius: 20,
        boxShadow: isPro ? "0 0 12px var(--accent-glow)" : "none",
        color: isPro ? "white" : "var(--text-muted)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        padding: "2px 10px",
        textTransform: "uppercase",
      }}
      {...props}
    >
      {isPro ? "✦ PRO" : "FREE"}
    </span>
  );
}
