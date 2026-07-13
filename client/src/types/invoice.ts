export type InvoiceStatus = "DRAFT" | "SCHEDULED" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED";
export type ProposalStatus = "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  notes: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  scheduledSendAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItem[];
}

export interface CreateInvoiceData {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  notes?: string;
  taxRate?: number;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceData {
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  taxRate?: number;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface Proposal {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  clientEmail: string;
  content: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalData {
  title: string;
  clientName: string;
  clientEmail: string;
  content: string;
}

export type UpdateProposalData = Partial<CreateProposalData> & {
  status?: ProposalStatus;
};

export interface FollowUpRule {
  id: string;
  invoiceId: string | null;
  userId: string;
  offsetDays: number;
  enabled: boolean;
  createdAt: string;
}

export interface FollowUpLog {
  id: string;
  invoiceId: string;
  ruleId: string;
  sentAt: string;
  bullmqJobId: string;
  resendMessageId: string | null;
}
