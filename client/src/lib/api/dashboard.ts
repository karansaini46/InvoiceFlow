import { api } from "@/lib/axios";
import type { InvoiceStatus } from "@/types/invoice";

export type DashboardRecentInvoice = {
  id: string;
  number: string;
  client: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  date: string;
};

export type DashboardStats = {
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  draftCount: number;
  recentInvoices: DashboardRecentInvoice[];
  monthlyRevenue: {
    month: string;
    total: number;
  }[];
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};
