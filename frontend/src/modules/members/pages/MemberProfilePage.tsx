import { format } from "date-fns";
import { CreditCard, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components";
import { Button, Card, CardContent, Spinner } from "@/components/ui";
import MemberStatusBadge from "../components/MemberStatusBadge";
import { useActivateMember, useDeactivateMember, useDeleteMember, useMember } from "../queries/useMembers";

const bmiCategoryLabel: Record<string, string> = {
  underweight: "Underweight",
  normal: "Normal",
  overweight: "Overweight",
  obese: "Obese",
};

export default function MemberProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const memberId = Number(id);

  const { data: member, isLoading } = useMember(memberId, {
    enabled: Number.isInteger(memberId) && memberId > 0,
  });
  const activateMutation = useActivateMember(memberId);
  const deactivateMutation = useDeactivateMember(memberId);
  const deleteMutation = useDeleteMember();

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return <div className="text-sm text-error">Invalid member id.</div>;
  }

  if (isLoading || !member) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-text-secondary">
          <Spinner size="sm" />
          Loading member profile...
        </CardContent>
      </Card>
    );
  }

  const handleStatusToggle = async () => {
    if (member.status === "active") {
      await deactivateMutation.mutateAsync();
      return;
    }
    await activateMutation.mutateAsync();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this member profile?");
    if (!confirmed) return;
    await deleteMutation.mutateAsync(memberId);
    navigate("/members");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${member.first_name} ${member.last_name}`}
        subtitle={`Member code: ${member.member_code}`}
        actions={[
          {
            label: "Back to Members",
            variant: "outline",
            onClick: () => navigate("/members"),
          },
          {
            label: "Edit Member",
            icon: <Pencil className="h-4 w-4" />,
            onClick: () => navigate(`/members/${memberId}/edit`),
          },
          {
            label: "Card",
            icon: <CreditCard className="h-4 w-4" />,
            variant: "outline",
            onClick: () => navigate(`/members/${memberId}/card`),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
              <img
                src={member.profile_picture_url ?? "/images/user.jpeg"}
                alt={`${member.first_name} ${member.last_name}`}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  {member.first_name} {member.last_name}
                </p>
                <p className="text-sm text-text-secondary">{member.member_code}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Profile Details</h2>
              <MemberStatusBadge status={member.status} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="ID Card Number" value={member.id_card_number} />
              <InfoRow label="Phone" value={member.phone} />
              <InfoRow label="Email" value={member.email} />
              <InfoRow label="Blood Group" value={member.blood_group} />
              <InfoRow
                label="Date of Birth"
                value={member.date_of_birth ? format(new Date(member.date_of_birth), "yyyy-MM-dd") : "-"}
              />
              <InfoRow label="Gender" value={member.gender?.replace(/_/g, " ") ?? "-"} />
              <InfoRow label="Join Date" value={format(new Date(member.join_date), "yyyy-MM-dd")} />
              <InfoRow label="Emergency Contact" value={member.emergency_contact_name} />
              <InfoRow label="Emergency Phone" value={member.emergency_contact_phone} />
            </div>
            <InfoRow label="Notes" value={member.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Body Metrics</h2>
            <InfoRow label="Height (cm)" value={member.height_cm?.toString()} />
            <InfoRow label="Weight (kg)" value={member.weight_kg?.toString()} />
            <InfoRow label="BMI" value={member.bmi?.toString()} />
            <InfoRow
              label="BMI Category"
              value={member.bmi_category ? bmiCategoryLabel[member.bmi_category] : "-"}
            />
            <Button
              onClick={handleStatusToggle}
              variant={member.status === "active" ? "danger" : "primary"}
              loading={activateMutation.isPending || deactivateMutation.isPending}
              fullWidth
            >
              {member.status === "active" ? "Set Inactive" : "Set Active"}
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              loading={deleteMutation.isPending}
              fullWidth
            >
              Delete Member
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{value && value.trim() ? value : "-"}</p>
    </div>
  );
}
