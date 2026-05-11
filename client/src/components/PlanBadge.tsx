import type { HTMLAttributes } from "react";

import { normalizePlan, type Plan } from "@/lib/plan";

type PlanBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  plan: string;
};

const badgeStyles: Record<Plan, string> = {
  free: "border-slate-200 bg-slate-100 text-slate-700",
  pro: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function PlanBadge({ plan, className = "", ...props }: PlanBadgeProps) {
  const normalizedPlan = normalizePlan(plan);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeStyles[normalizedPlan]} ${className}`}
      {...props}
    >
      {normalizedPlan === "pro" ? "PRO" : "FREE"}
    </span>
  );
}
