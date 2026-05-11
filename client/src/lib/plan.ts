export type Plan = "free" | "pro";

export const normalizePlan = (plan: string): Plan =>
  plan.toLowerCase() === "pro" ? "pro" : "free";
