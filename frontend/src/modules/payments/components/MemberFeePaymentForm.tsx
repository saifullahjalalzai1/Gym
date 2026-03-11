import { useEffect } from "react";

import { Button, Card, CardContent, Input } from "@/components/ui";
import { useMemberPaymentForm } from "../hooks/useMemberPaymentForm";

interface OptionItem {
  id: number;
  label: string;
}

interface MemberFeePaymentFormProps {
  memberOptions: OptionItem[];
  selectedMemberId: number | null;
  selectedCycleMonth: string;
  currentCycleId?: number;
  isSubmitting?: boolean;
  onMemberChange: (memberId: number | null) => void;
  onCycleMonthChange: (cycleMonth: string) => void;
  onSubmit: (values: {
    member_id: number;
    cycle_id?: number;
    amount_paid: number;
    discount_amount: number;
    payment_method: "cash" | "bank_transfer" | "card" | "other";
    paid_at: string;
    note?: string;
  }) => Promise<void> | void;
}

export default function MemberFeePaymentForm({
  memberOptions,
  selectedMemberId,
  selectedCycleMonth,
  currentCycleId,
  isSubmitting = false,
  onMemberChange,
  onCycleMonthChange,
  onSubmit,
}: MemberFeePaymentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useMemberPaymentForm({
    member_id: selectedMemberId ?? 0,
    cycle_id: currentCycleId,
  });

  useEffect(() => {
    setValue("member_id", selectedMemberId ?? 0);
  }, [selectedMemberId, setValue]);

  useEffect(() => {
    setValue("cycle_id", currentCycleId);
  }, [currentCycleId, setValue]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          cycle_id: currentCycleId,
          paid_at: new Date(values.paid_at).toISOString(),
          note: values.note?.trim() || undefined,
        })
      )}
    >
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-base font-semibold text-text-primary">Add Member Fee Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Member</label>
              <select
                value={selectedMemberId ?? ""}
                onChange={(event) => {
                  const value = event.target.value ? Number(event.target.value) : null;
                  onMemberChange(value);
                }}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select member</option>
                {memberOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.member_id?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.member_id.message}</p>
              )}
            </div>

            <Input
              type="month"
              label="Cycle Month"
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
            <Input
              type="number"
              step="0.01"
              label="Discount Amount (AFN)"
              error={errors.discount_amount?.message}
              {...register("discount_amount", { valueAsNumber: true })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              Record Member Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
