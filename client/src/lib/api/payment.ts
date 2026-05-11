import { api } from "@/lib/axios";
import { normalizePlan, type Plan } from "@/lib/plan";

export const paymentApi = {
  getStatus: async (): Promise<{ plan: Plan }> => {
    const response = await api.get<{ plan: string }>("/payment/status");
    return { plan: normalizePlan(response.data.plan) };
  },
  mockUpgrade: async (): Promise<{ success: true; plan: Plan }> => {
    const response = await api.post<{ success: true; plan: string }>(
      "/payment/mock-upgrade",
    );

    return {
      success: true,
      plan: normalizePlan(response.data.plan),
    };
  },
};
