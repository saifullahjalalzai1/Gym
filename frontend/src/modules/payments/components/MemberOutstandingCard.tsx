import { Card, CardContent } from "@/components/ui";
import type { MemberFeeCycleSummary } from "../types/payments";

interface MemberOutstandingCardProps {
  summary?: MemberFeeCycleSummary;
  loading?: boolean;
}

const formatMoney = (value?: string) => Number(value ?? "0").toLocaleString();

export default function MemberOutstandingCard({
  summary,
  loading = false,
}: MemberOutstandingCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-text-secondary">Loading member fee summary...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-4 py-6 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Current Cycle Remaining</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">
            AFN {formatMoney(summary?.current_cycle_remaining)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Total Outstanding</p>
          <p className="mt-1 text-xl font-semibold text-warning">
            AFN {formatMoney(summary?.total_outstanding)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Overdue Cycles</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">
            {summary?.overdue_cycles_count ?? 0}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
