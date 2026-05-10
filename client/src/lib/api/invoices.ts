import { api } from "@/lib/axios";
import type { Invoice, CreateInvoiceData, UpdateInvoiceData } from "@/types/invoice";

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

  updateStatus: async (id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE"): Promise<Invoice> => {
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
};
