import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import MemberForm from "../components/MemberForm";
import { useCreateMember } from "../queries/useMembers";
import type { MemberFormValues } from "../types/member";

export default function AddMemberPage() {
  const navigate = useNavigate();
  const createMemberMutation = useCreateMember();

  const handleCreate = async (values: MemberFormValues) => {
    const createdMember = await createMemberMutation.mutateAsync(values);
    navigate(`/members/${createdMember.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Member"
        subtitle="Create a new member profile"
        actions={[
          {
            label: "Back to List",
            variant: "outline",
            onClick: () => navigate("/members"),
          },
        ]}
      />
      <MemberForm
        mode="create"
        isSubmitting={createMemberMutation.isPending}
        onSubmit={handleCreate}
        onCancel={() => navigate("/members")}
      />
    </div>
  );
}
