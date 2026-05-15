import type { InvoiceStatus, ProposalStatus } from "@/types/invoice";

interface StatusBadgeProps {
  status: InvoiceStatus | ProposalStatus;
}

const statusClasses: Record<InvoiceStatus | ProposalStatus, string> = {
  ACCEPTED: "badge-paid",
  DECLINED: "badge-overdue",
  DRAFT: "badge-draft",
  OVERDUE: "badge-overdue",
  PAID: "badge-paid",
  SENT: "badge-sent",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={statusClasses[status] ?? "badge-draft"}>{status}</span>;
}
