import { api } from "@/lib/axios";
import type {
  CreateProposalData,
  Proposal,
  ProposalStatus,
  UpdateProposalData,
} from "@/types/invoice";

export const proposalsApi = {
  getAll: async (): Promise<Proposal[]> => {
    const response = await api.get("/proposals");
    return response.data;
  },

  getById: async (id: string): Promise<Proposal> => {
    const response = await api.get(`/proposals/${id}`);
    return response.data;
  },

  create: async (data: CreateProposalData): Promise<Proposal> => {
    const response = await api.post("/proposals", data);
    return response.data;
  },

  update: async (id: string, data: UpdateProposalData): Promise<Proposal> => {
    const response = await api.patch(`/proposals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/proposals/${id}`);
  },

  send: async (id: string): Promise<Proposal> => {
    const response = await api.post(`/proposals/${id}/send`);
    return response.data;
  },

  updateStatus: async (id: string, status: ProposalStatus): Promise<Proposal> => {
    const response = await api.patch(`/proposals/${id}/status`, { status });
    return response.data;
  },

  convert: async (id: string): Promise<{ invoiceId: string }> => {
    const response = await api.post(`/proposals/${id}/convert`);
    return response.data;
  },
};
