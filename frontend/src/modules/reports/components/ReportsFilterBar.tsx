import { Card, CardContent, Input } from "@/components/ui";

import type { AllowedMonths } from "../types/reports";
import type { PaymentMethodFilter } from "../stores/useReportsStore";

interface MemberOption {
  id: number;
  label: string;
}

interface ReportsFilterBarProps {
  months: AllowedMonths;
  paymentMemberId: number | null;
  paymentMethod: PaymentMethodFilter;
  paymentDateFrom: string;
  paymentDateTo: string;
  memberOptions: MemberOption[];
  onMonthsChange: (months: AllowedMonths) => void;
  onPaymentMemberChange: (memberId: number | null) => void;
  onPaymentMethodChange: (method: PaymentMethodFilter) => void;
  onPaymentDateFromChange: (value: string) => void;
  onPaymentDateToChange: (value: string) => void;
}

export default function ReportsFilterBar({
  months,
  paymentMemberId,
  paymentMethod,
  paymentDateFrom,
  paymentDateTo,
  memberOptions,
  onMonthsChange,
  onPaymentMemberChange,
  onPaymentMethodChange,
  onPaymentDateFromChange,
  onPaymentDateToChange,
}: ReportsFilterBarProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-text-primary">Global Filters</h3>
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Analytics Window
            </label>
            <select
              value={months}
              onChange={(event) => onMonthsChange(Number(event.target.value) as AllowedMonths)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 24 months</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Member</label>
            <select
              value={paymentMemberId ?? ""}
              onChange={(event) =>
                onPaymentMemberChange(event.target.value ? Number(event.target.value) : null)
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Members</option>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(event) =>
                onPaymentMethodChange(event.target.value as PaymentMethodFilter)
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Payment Date From"
            type="date"
            value={paymentDateFrom}
            onChange={(event) => onPaymentDateFromChange(event.target.value)}
          />
          <Input
            label="Payment Date To"
            type="date"
            value={paymentDateTo}
            onChange={(event) => onPaymentDateToChange(event.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

