import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import { Button, Card, CardContent, CardHeader, Input, Textarea } from "@/components/ui";

import { useDeleteGymLogo, useGymProfile, useUpdateGymProfile, useUploadGymLogo } from "../queries";
import type { GymProfilePayload } from "../types";

const defaultHours = {
  mon: "06:00-22:00",
  tue: "06:00-22:00",
  wed: "06:00-22:00",
  thu: "06:00-22:00",
  fri: "06:00-22:00",
  sat: "07:00-21:00",
  sun: "07:00-20:00",
};

export default function GymInformationSettingsPage() {
  const navigate = useNavigate();
  const gymQuery = useGymProfile();
  const updateMutation = useUpdateGymProfile();
  const uploadLogoMutation = useUploadGymLogo();
  const deleteLogoMutation = useDeleteGymLogo();

  const [form, setForm] = useState<GymProfilePayload>({
    gym_name: "",
    address: "",
    phone_number: "",
    email: "",
    website: "",
    description: "",
    working_hours_json: defaultHours,
  });

  useEffect(() => {
    if (!gymQuery.data) return;
    setForm({
      gym_name: gymQuery.data.gym_name,
      address: gymQuery.data.address,
      phone_number: gymQuery.data.phone_number,
      email: gymQuery.data.email,
      website: gymQuery.data.website,
      description: gymQuery.data.description,
      working_hours_json: gymQuery.data.working_hours_json || defaultHours,
    });
  }, [gymQuery.data]);

  const workingHoursPretty = useMemo(
    () => JSON.stringify(form.working_hours_json || defaultHours, null, 2),
    [form.working_hours_json]
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateMutation.mutate(form);
  };

  const onLogoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadLogoMutation.mutate(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gym Information Settings"
        subtitle="Manage gym profile, logo, and contact details."
        actions={[
          {
            label: "Back",
            variant: "outline",
            onClick: () => navigate("/settings"),
          },
        ]}
      />

      <Card>
        <CardHeader title="Gym Profile" subtitle="This information is used across billing, cards, and printed documents." />
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Gym Name"
                value={form.gym_name}
                onChange={(e) => setForm((prev) => ({ ...prev, gym_name: e.target.value }))}
              />
              <Input
                label="Phone Number"
                value={form.phone_number}
                onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label="Website (Optional)"
                value={form.website || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <Textarea
              label="Address"
              rows={3}
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />

            <Textarea
              label="Gym Description"
              rows={3}
              value={form.description || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            <Textarea
              label="Working Hours (JSON)"
              rows={8}
              value={workingHoursPretty}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as Record<string, string>;
                  setForm((prev) => ({ ...prev, working_hours_json: parsed }));
                } catch {
                  // Keep current value when invalid JSON is entered.
                }
              }}
            />

            <div className="flex justify-end">
              <Button type="submit" loading={updateMutation.isPending || gymQuery.isLoading}>
                Save Gym Information
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Gym Logo" subtitle="Upload or remove gym logo for identity cards and invoices." />
        <CardContent className="space-y-4">
          {gymQuery.data?.gym_logo_url ? (
            <img
              src={gymQuery.data.gym_logo_url}
              alt="Gym logo"
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
          ) : (
            <p className="text-sm text-text-secondary">No logo uploaded.</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover">
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={onLogoSelected} />
            </label>

            <Button type="button" variant="outline" onClick={() => deleteLogoMutation.mutate()} loading={deleteLogoMutation.isPending}>
              Remove Logo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
