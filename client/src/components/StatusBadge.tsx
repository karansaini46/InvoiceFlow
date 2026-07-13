interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  return (
    <span className={`badge badge-${normalizedStatus}`}>
      {status}
    </span>
  );
}
