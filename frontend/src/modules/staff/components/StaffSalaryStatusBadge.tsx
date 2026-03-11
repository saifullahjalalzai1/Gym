import { Badge } from "@/components/ui";
import type { StaffSalaryStatus } from "../types/staff";

interface StaffSalaryStatusBadgeProps {
  status: StaffSalaryStatus;
}

export default function StaffSalaryStatusBadge({ status }: StaffSalaryStatusBadgeProps) {
  if (status === "paid") {
    return (
      <Badge variant="success" dot>
        Paid
      </Badge>
    );
  }

  if (status === "partial") {
    return (
      <Badge variant="warning" dot>
        Partial
      </Badge>
    );
  }

  return (
    <Badge variant="default" dot>
      Unpaid
    </Badge>
  );
}

