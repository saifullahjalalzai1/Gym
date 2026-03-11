import { format } from "date-fns";
import { CreditCard, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components";
import { Button, Card, CardContent, Spinner } from "@/components/ui";
import StaffEmploymentStatusBadge from "../components/StaffEmploymentStatusBadge";
import StaffSalaryStatusBadge from "../components/StaffSalaryStatusBadge";
import { useActivateStaff, useDeactivateStaff, useDeleteStaff, useStaff } from "../queries/useStaff";

const getPositionLabel = (position: string, positionOther?: string | null) => {
  if (position === "other" && positionOther) {
    return positionOther;
  }
  return position.charAt(0).toUpperCase() + position.slice(1);
};

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const staffId = Number(id);

  const { data: staff, isLoading } = useStaff(staffId, {
    enabled: Number.isInteger(staffId) && staffId > 0,
  });
  const activateMutation = useActivateStaff(staffId);
  const deactivateMutation = useDeactivateStaff(staffId);
  const deleteMutation = useDeleteStaff();

  if (!Number.isInteger(staffId) || staffId <= 0) {
    return <div className="text-sm text-error">Invalid staff id.</div>;
  }

  if (isLoading || !staff) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-text-secondary">
          <Spinner size="sm" />
          Loading staff profile...
        </CardContent>
      </Card>
    );
  }

  const handleStatusToggle = async () => {
    if (staff.employment_status === "active") {
      await deactivateMutation.mutateAsync();
      return;
    }
    await activateMutation.mutateAsync();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this staff profile?");
    if (!confirmed) return;
    await deleteMutation.mutateAsync(staffId);
    navigate("/staff");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${staff.first_name} ${staff.last_name}`}
        subtitle={`Staff code: ${staff.staff_code}`}
        actions={[
          {
            label: "Back to Staff",
            variant: "outline",
            onClick: () => navigate("/staff"),
          },
          {
            label: "Edit Staff",
            icon: <Pencil className="h-4 w-4" />,
            onClick: () => navigate(`/staff/${staffId}/edit`),
          },
          {
            label: "Card",
            icon: <CreditCard className="h-4 w-4" />,
            variant: "outline",
            onClick: () => navigate(`/staff/${staffId}/card`),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
              <img
                src={staff.profile_picture_url ?? "/images/user.jpeg"}
                alt={`${staff.first_name} ${staff.last_name}`}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  {staff.first_name} {staff.last_name}
                </p>
                <p className="text-sm text-text-secondary">{staff.staff_code}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StaffEmploymentStatusBadge status={staff.employment_status} />
              <StaffSalaryStatusBadge status={staff.salary_status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="Position" value={getPositionLabel(staff.position, staff.position_other)} />
              <InfoRow label="ID Card Number" value={staff.id_card_number} />
              <InfoRow label="Father Name" value={staff.father_name} />
              <InfoRow label="Mobile Number" value={staff.mobile_number} />
              <InfoRow label="WhatsApp Number" value={staff.whatsapp_number} />
              <InfoRow label="Email" value={staff.email} />
              <InfoRow label="Blood Group" value={staff.blood_group} />
              <InfoRow
                label="Date of Birth"
                value={
                  staff.date_of_birth
                    ? format(new Date(staff.date_of_birth), "yyyy-MM-dd")
                    : "-"
                }
              />
              <InfoRow label="Age" value={staff.age?.toString() ?? "-"} />
              <InfoRow label="Date Hired" value={format(new Date(staff.date_hired), "yyyy-MM-dd")} />
            </div>

            <InfoRow label="Notes" value={staff.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Salary Information</h2>
            <InfoRow
              label="Monthly Salary"
              value={`${staff.salary_currency} ${Number(staff.monthly_salary).toLocaleString()}`}
            />
            <InfoRow label="Salary Status" value={staff.salary_status} />
            <InfoRow label="Employment Status" value={staff.employment_status.replace(/_/g, " ")} />
            <Button
              onClick={handleStatusToggle}
              variant={staff.employment_status === "active" ? "danger" : "primary"}
              loading={activateMutation.isPending || deactivateMutation.isPending}
              fullWidth
            >
              {staff.employment_status === "active" ? "Set Inactive" : "Set Active"}
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              loading={deleteMutation.isPending}
              fullWidth
            >
              Delete Staff
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  const displayValue = value && value.trim() ? value : "-";
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{displayValue}</p>
    </div>
  );
}
