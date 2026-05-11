export type PublicPlan = "free" | "pro";

export const toPublicPlan = (plan: string): PublicPlan =>
  plan.toLowerCase() === "pro" ? "pro" : "free";

export const toDatabasePlan = (plan: PublicPlan): "FREE" | "PRO" =>
  plan === "pro" ? "PRO" : "FREE";
