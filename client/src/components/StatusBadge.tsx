import type { InvoiceStatus, ProposalStatus } from "@/types/invoice";

interface StatusBadgeProps {
  status: InvoiceStatus | ProposalStatus;
}

const statusConfig: Record<InvoiceStatus | ProposalStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PAID: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  DECLINED: {
    label: "Declined",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
