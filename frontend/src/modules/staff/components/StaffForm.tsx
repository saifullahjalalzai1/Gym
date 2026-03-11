import { Button, Card, CardContent, Input } from "@/components/ui";
import { useStaffForm } from "../hooks/useStaffForm";
import type { StaffFormValues, StaffPosition } from "../types/staff";

interface StaffFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<StaffFormValues>;
  existingProfilePictureUrl?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: StaffFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

export default function StaffForm({
  mode,
  initialValues,
  existingProfilePictureUrl = null,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: StaffFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useStaffForm(initialValues);

  const selectedPosition = watch("position");
  const selectedProfilePicture = watch("profile_picture");
  const selectedFileName =
    selectedProfilePicture && selectedProfilePicture.length > 0
      ? selectedProfilePicture[0].name
      : "";

  const normalizePayload = (values: StaffFormValues): StaffFormValues => ({
    ...values,
    position: values.position as StaffPosition,
    position_other: values.position === "other" ? values.position_other?.trim() || undefined : undefined,
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    father_name: values.father_name?.trim() || undefined,
    mobile_number: values.mobile_number.trim(),
    whatsapp_number: values.whatsapp_number?.trim() || undefined,
    id_card_number: values.id_card_number?.trim() || undefined,
    email: values.email?.trim() || undefined,
    blood_group: values.blood_group || undefined,
    profile_picture: values.profile_picture,
    date_of_birth: values.date_of_birth?.trim() || undefined,
    date_hired: values.date_hired.trim(),
    salary_currency: values.salary_currency.trim() || "AFN",
    notes: values.notes?.trim() || undefined,
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(normalizePayload(values)))}>
      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Position
              </label>
              <select
                {...register("position")}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="trainer">Trainer</option>
                <option value="clerk">Clerk</option>
                <option value="manager">Manager</option>
                <option value="cleaner">Cleaner</option>
                <option value="other">Other</option>
              </select>
              {errors.position?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.position.message}</p>
              )}
            </div>

            {selectedPosition === "other" && (
              <Input
                label="Other Position"
                error={errors.position_other?.message}
                {...register("position_other")}
              />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="First Name"
              error={errors.first_name?.message}
              {...register("first_name")}
            />
            <Input label="Last Name" error={errors.last_name?.message} {...register("last_name")} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Father Name"
              error={errors.father_name?.message}
              {...register("father_name")}
            />
            <Input
              label="ID Card Number (Tazkira)"
              error={errors.id_card_number?.message}
              {...register("id_card_number")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mobile Number"
              error={errors.mobile_number?.message}
              {...register("mobile_number")}
            />
            <Input
              label="WhatsApp Number"
              error={errors.whatsapp_number?.message}
              {...register("whatsapp_number")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input type="email" label="Email" error={errors.email?.message} {...register("email")} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Blood Group
              </label>
              <select
                {...register("blood_group")}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.blood_group?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.blood_group.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white"
              {...register("profile_picture")}
            />
            {selectedFileName && (
              <p className="mt-1 text-xs text-text-secondary">Selected: {selectedFileName}</p>
            )}
            {!selectedFileName && existingProfilePictureUrl && (
              <p className="mt-1 text-xs text-text-secondary">Current profile picture is set.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="date"
              label="Date of Birth"
              error={errors.date_of_birth?.message}
              {...register("date_of_birth")}
            />
            <Input
              type="date"
              label="Date Hired"
              error={errors.date_hired?.message}
              {...register("date_hired")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="number"
              step="0.01"
              label="Monthly Salary"
              error={errors.monthly_salary?.message}
              {...register("monthly_salary", { valueAsNumber: true })}
            />
            <Input
              label="Salary Currency"
              error={errors.salary_currency?.message}
              {...register("salary_currency")}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Salary Status
              </label>
              <select
                {...register("salary_status")}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
              {errors.salary_status?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.salary_status.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Employment Status
              </label>
              <select
                {...register("employment_status")}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="resigned">Resigned</option>
              </select>
              {errors.employment_status?.message && (
                <p className="mt-1.5 text-sm text-error">{errors.employment_status.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Notes</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register("notes")}
            />
            {errors.notes?.message && <p className="mt-1.5 text-sm text-error">{errors.notes.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={isSubmitting}>
              {mode === "create" ? "Create Staff" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
