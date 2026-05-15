import { api } from "@/lib/axios";

export type InvoiceAnalysis = {
  risk_level: "low" | "medium" | "high";
  issues: string[];
  suggestions: string[];
  summary: string;
};

export type CashFlowInsight = {
  summary: string;
  insights: string[];
  predicted_revenue_30d: number;
};

export type PaymentReminder = {
  subject: string;
  body: string;
};

type AiResponse<T> = {
  success: true;
  data: T;
};

export const aiApi = {
  analyzeInvoice: async (invoiceId: string): Promise<InvoiceAnalysis> => {
    const response = await api.post<AiResponse<InvoiceAnalysis>>("/ai/analyze-invoice", {
      invoiceId,
    });

    return response.data.data;
  },
  getCashFlowInsights: async (): Promise<CashFlowInsight> => {
    const response = await api.post<AiResponse<CashFlowInsight>>("/ai/cash-flow-insights");
    return response.data.data;
  },
  generatePaymentReminder: async (invoiceId: string): Promise<PaymentReminder> => {
    const response = await api.post<AiResponse<PaymentReminder>>("/ai/payment-reminder", {
      invoiceId,
    });

    return response.data.data;
  },
};
