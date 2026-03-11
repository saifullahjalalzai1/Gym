import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import TrainerForm from "../components/TrainerForm";
import { useCreateTrainer } from "../queries/useTrainers";
import type { TrainerFormValues } from "../types/trainer";

export default function AddTrainerPage() {
  const navigate = useNavigate();
  const createTrainerMutation = useCreateTrainer();

  const handleCreate = async (values: TrainerFormValues) => {
    const createdTrainer = await createTrainerMutation.mutateAsync(values);
    navigate(`/trainers/${createdTrainer.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Trainer"
        subtitle="Create a new trainer profile"
        actions={[
          {
            label: "Back to List",
            variant: "outline",
            onClick: () => navigate("/trainers"),
          },
        ]}
      />
      <TrainerForm
        mode="create"
        isSubmitting={createTrainerMutation.isPending}
        onSubmit={handleCreate}
        onCancel={() => navigate("/trainers")}
      />
    </div>
  );
}
