import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import StaffForm from "../components/StaffForm";
import { useCreateStaff } from "../queries/useStaff";
import type { StaffFormValues } from "../types/staff";

export default function AddStaffPage() {
  const navigate = useNavigate();
  const createStaffMutation = useCreateStaff();

  const handleCreate = async (values: StaffFormValues) => {
    const createdStaff = await createStaffMutation.mutateAsync(values);
    navigate(`/staff/${createdStaff.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Staff"
        subtitle="Create a new staff profile"
        actions={[
          {
            label: "Back to List",
            variant: "outline",
            onClick: () => navigate("/staff"),
          },
        ]}
      />
      <StaffForm
        mode="create"
        isSubmitting={createStaffMutation.isPending}
        onSubmit={handleCreate}
        onCancel={() => navigate("/staff")}
      />
    </div>
  );
}

