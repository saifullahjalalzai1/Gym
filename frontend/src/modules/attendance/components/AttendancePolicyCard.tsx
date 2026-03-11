import { useEffect, useState } from "react";

import { Button, Card, CardContent } from "@/components/ui";
import { useAttendancePolicy, useUpdateAttendancePolicy } from "../queries/useAttendance";

export default function AttendancePolicyCard() {
  const { data: policy, isLoading } = useAttendancePolicy();
  const updatePolicy = useUpdateAttendancePolicy();

  const [blockFutureDates, setBlockFutureDates] = useState(true);
  const [lateDeductionEnabled, setLateDeductionEnabled] = useState(true);
  const [lateDeductionFraction, setLateDeductionFraction] = useState("0.5");
  const [leaveIsPaid, setLeaveIsPaid] = useState(true);
  const [missingAsAbsent, setMissingAsAbsent] = useState(true);

  useEffect(() => {
    if (!policy) return;
    setBlockFutureDates(policy.block_future_dates);
    setLateDeductionEnabled(policy.late_deduction_enabled);
    setLateDeductionFraction(policy.late_deduction_fraction);
    setLeaveIsPaid(policy.leave_is_paid);
    setMissingAsAbsent(policy.missing_as_absent);
  }, [policy]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Attendance Policy</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Configure salary impact and date restrictions for attendance.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
            Loading policy...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={blockFutureDates}
                onChange={(event) => setBlockFutureDates(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Block future attendance dates
            </label>

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={lateDeductionEnabled}
                onChange={(event) => setLateDeductionEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Late days affect salary
            </label>

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={leaveIsPaid}
                onChange={(event) => setLeaveIsPaid(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Leave is paid
            </label>

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={missingAsAbsent}
                onChange={(event) => setMissingAsAbsent(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Missing records count as absent
            </label>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Late deduction fraction (0 to 1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={lateDeductionFraction}
                onChange={(event) => setLateDeductionFraction(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:max-w-xs"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                type="button"
                loading={updatePolicy.isPending}
                onClick={() =>
                  updatePolicy.mutate({
                    block_future_dates: blockFutureDates,
                    late_deduction_enabled: lateDeductionEnabled,
                    late_deduction_fraction: Number(lateDeductionFraction),
                    leave_is_paid: leaveIsPaid,
                    missing_as_absent: missingAsAbsent,
                  })
                }
              >
                Save Policy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

