import { cn } from "@/lib/utils";
import { DealStatus } from "@/types/deal";

interface DealStatusBadgeProps {
  status: DealStatus;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COUNTERED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  DECLINED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  AWAITING_RESPONSE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status]
      )}
    >
      {status}
    </span>
  );
}