import { useEffect } from "react";

import { Button, Card, CardContent, Input } from "@/components/ui";
import { useSalaryPaymentForm } from "../hooks/useSalaryPaymentForm";

interface OptionItem {
  id: number;
  label: string;
}

interface StaffSalaryPaymentFormProps {
  staffOptions: OptionItem[];
  selectedStaffId: number | null;
  selectedCycleMonth: string;
  currentPeriodId?: number;
  isSubmitting?: boolean;
  onStaffChange: (staffId: number | null) => void;
  onCycleMonthChange: (periodMonth: string) => void;
  onSubmit: (values: {
    staff_id: number;
    period_id?: number;
    amount_paid: number;
    payment_method: "cash" | "bank_transfer" | "card" | "other";
    paid_at: string;
    note?: string;
  }) => Promise<void> | void;
}

export default function StaffSalaryPaymentForm({
  staffOptions,
  selectedStaffId,
  selectedCycleMonth,
  currentPeriodId,
  isSubmitting = false,
  onStaffChange,
  onCycleMonthChange,
  onSubmit,
}: StaffSalaryPaymentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useSalaryPaymentForm({
    staff_id: selectedStaffId ?? 0,
    period_id: currentPeriodId,
  });

  useEffect(() => {
    setValue("staff_id", selectedStaffId ?? 0);
  }, [selectedStaffId, setValue]);

  useEffect(() => {
    setValue("period_id", currentPeriodId);
  }, [currentPeriodId, setValue]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          period_id: currentPeriodId,
          paid_at: new Date(values.paid_at).toISOString(),
          note: values.note?.trim() || undefined,
        })
      )}
    >
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-base font-semibold text-text-primary">Add Staff Salary Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Staff</label>
              <select
                value={selectedStaffId ?? ""}
                onChange={(event) => {
                  const value = event.target.value ? Number(event.target.value) : null;
                  onStaffChange(value);
                }}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select staff</option>
                {staffOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.staff_id?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.staff_id.message}</p>
              )}
            </div>

            <Input
              type="month"
              label="Salary Period"
              value={selectedCycleMonth.slice(0, 7)}
              onChange={(event) => onCycleMonthChange(`${event.target.value}-01`)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="number"
              step="0.01"
              label="Paid Amount (AFN)"
              error={errors.amount_paid?.message}
              {...register("amount_paid", { valueAsNumber: true })}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Payment Method</label>
              <select
                {...register("payment_method")}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
              {errors.payment_method?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.payment_method.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="datetime-local"
              label="Paid At"
              error={errors.paid_at?.message}
              {...register("paid_at")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Note</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register("note")}
            />
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" loading={isSubmitting}>
              Record Salary Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
