type Status = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "ACCEPTED" | "DECLINED";

const map: Record<Status, string> = {
  ACCEPTED: "badge badge-accepted",
  DECLINED: "badge badge-declined",
  DRAFT: "badge badge-draft",
  OVERDUE: "badge badge-overdue",
  PAID: "badge badge-paid",
  SENT: "badge badge-sent",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={map[status as Status] ?? "badge badge-draft"}>{status}</span>;
}
