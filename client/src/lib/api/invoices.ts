import { api } from "@/lib/axios";
import type { Invoice, CreateInvoiceData, UpdateInvoiceData, InvoiceStatus, FollowUpRule } from "@/types/invoice";

export const invoicesApi = {
  getAll: async (): Promise<Invoice[]> => {
    const response = await api.get("/invoices");
    return response.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post("/invoices", data);
    return response.data;
  },

  update: async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  updateStatus: async (id: string, status: InvoiceStatus): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}/status`, { status });
    return response.data;
  },

  send: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },

  schedule: async (id: string, scheduledSendAt: string): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}/schedule`, { scheduledSendAt });
    return response.data;
  },

  cancelSchedule: async (id: string): Promise<Invoice> => {
    const response = await api.delete(`/invoices/${id}/schedule`);
    return response.data;
  },

  getFollowUpRules: async (id: string): Promise<{ rules: FollowUpRule[]; isDefault: boolean }> => {
    const response = await api.get(`/invoices/${id}/follow-up-rules`);
    return response.data;
  },

  updateFollowUpRules: async (id: string, rules: { offsetDays: number; enabled: boolean }[]): Promise<{ rules: FollowUpRule[]; isDefault: boolean }> => {
    const response = await api.put(`/invoices/${id}/follow-up-rules`, { rules });
    return response.data;
  },

  cancelFollowUps: async (id: string): Promise<{ removed: number }> => {
    const response = await api.post(`/invoices/${id}/cancel-follow-ups`);
    return response.data;
  },
};
