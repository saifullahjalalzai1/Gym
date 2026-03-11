import { Badge } from "@/components/ui";
import type { MemberStatus } from "../types/member";

interface MemberStatusBadgeProps {
  status: MemberStatus;
}

export default function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  return status === "active" ? (
    <Badge variant="success" dot>
      Active
    </Badge>
  ) : (
    <Badge variant="default" dot>
      Inactive
    </Badge>
  );
}
