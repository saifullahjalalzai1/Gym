import { Badge } from "@/components/ui";
import type { TrainerSalaryStatus } from "../types/trainer";

interface TrainerSalaryStatusBadgeProps {
  status: TrainerSalaryStatus;
}

export default function TrainerSalaryStatusBadge({ status }: TrainerSalaryStatusBadgeProps) {
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
