import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import { Button, Card, CardContent, CardHeader, Input, Textarea } from "@/components/ui";

import {
  useActivateMembershipPlan,
  useCreateMembershipPlan,
  useDeactivateMembershipPlan,
  useMembershipPlans,
} from "../queries";
import type { DurationType, MembershipPlanPayload } from "../types";

const defaultPlanForm: MembershipPlanPayload = {
  name: "",
  duration_type: "monthly",
  duration_months: 1,
  fee: "0",
  description: "",
  is_active: true,
};

export default function MembershipPlanSettingsPage() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<MembershipPlanPayload>(defaultPlanForm);

  const plansQuery = useMembershipPlans();
  const createMutation = useCreateMembershipPlan();
  const activateMutation = useActivateMembershipPlan();
  const deactivateMutation = useDeactivateMembershipPlan();

  const plans = plansQuery.data?.results ?? [];

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => {
        setForm(defaultPlanForm);
        setIsCreateOpen(false);
      },
    });
  };

  const onDurationTypeChange = (durationType: DurationType) => {
    const durationMonths = durationType === "monthly" ? 1 : durationType === "quarterly" ? 3 : 12;
    setForm((prev) => ({ ...prev, duration_type: durationType, duration_months: durationMonths }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Plan Configuration"
        subtitle="Manage global Basic, Premium, VIP, and custom plan templates."
        actions={[
          {
            label: "Back",
            variant: "outline",
            onClick: () => navigate("/settings"),
          },
          {
            label: "Create Plan",
            onClick: () => setIsCreateOpen(true),
          },
        ]}
      />

      <Card>
        <CardHeader title="Membership Plans" subtitle="Activate/deactivate plan templates used across billing and membership workflows." />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2 pr-4">Fee</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{plan.name}</td>
                    <td className="py-2 pr-4 capitalize">{plan.duration_type} ({plan.duration_months} months)</td>
                    <td className="py-2 pr-4">AFN {Number(plan.fee).toLocaleString()}</td>
                    <td className="py-2 pr-4">{plan.is_active ? "Active" : "Inactive"}</td>
                    <td className="py-2 pr-4">
                      {plan.is_active ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => deactivateMutation.mutate(plan.id)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="outline" onClick={() => activateMutation.mutate(plan.id)}>
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader title="Create Membership Plan" />
            <CardContent>
              <form className="space-y-4" onSubmit={onCreate}>
                <Input label="Plan Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">Duration Type</label>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.duration_type}
                    onChange={(e) => onDurationTypeChange(e.target.value as DurationType)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <Input
                  label="Plan Fee"
                  type="number"
                  value={form.fee}
                  onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))}
                />
                <Textarea
                  label="Description"
                  value={form.description || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={createMutation.isPending}>
                    Create Plan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
