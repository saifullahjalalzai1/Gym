import { Badge } from "@/components/ui";
import type { TrainerEmploymentStatus } from "../types/trainer";

interface TrainerEmploymentStatusBadgeProps {
  status: TrainerEmploymentStatus;
}

export default function TrainerEmploymentStatusBadge({
  status,
}: TrainerEmploymentStatusBadgeProps) {
  if (status === "active") {
    return (
      <Badge variant="success" dot>
        Active
      </Badge>
    );
  }

  if (status === "on_leave") {
    return (
      <Badge variant="warning" dot>
        On Leave
      </Badge>
    );
  }

  if (status === "resigned") {
    return (
      <Badge variant="danger" dot>
        Resigned
      </Badge>
    );
  }

  return (
    <Badge variant="default" dot>
      Inactive
    </Badge>
  );
}
