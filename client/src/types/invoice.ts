export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

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
