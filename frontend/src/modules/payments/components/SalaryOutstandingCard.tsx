import { Card, CardContent } from "@/components/ui";
import type { StaffSalarySummary } from "../types/payments";

interface SalaryOutstandingCardProps {
  summary?: StaffSalarySummary;
  loading?: boolean;
}

const formatMoney = (value?: string) => Number(value ?? "0").toLocaleString();

export default function SalaryOutstandingCard({
  summary,
  loading = false,
}: SalaryOutstandingCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-text-secondary">Loading salary summary...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-4 py-6 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Period</p>
          <p className="mt-1 text-xl font-semibold text-text-primary">
            {summary?.period_month ?? "--"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Remaining Salary</p>
          <p className="mt-1 text-xl font-semibold text-warning">
            AFN {formatMoney(summary?.remaining_amount)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">Status</p>
          <p className="mt-1 text-xl font-semibold capitalize text-text-primary">
            {summary?.status ?? "unpaid"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
