import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components";
import { Card, CardContent, Spinner } from "@/components/ui";
import TrainerForm from "../components/TrainerForm";
import { useTrainer, useUpdateTrainer } from "../queries/useTrainers";
import type { TrainerFormValues } from "../types/trainer";

export default function EditTrainerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const trainerId = Number(id);

  const { data: trainer, isLoading } = useTrainer(trainerId, {
    enabled: Number.isInteger(trainerId) && trainerId > 0,
  });
  const updateTrainerMutation = useUpdateTrainer(trainerId);

  if (!Number.isInteger(trainerId) || trainerId <= 0) {
    return <div className="text-sm text-error">Invalid trainer id.</div>;
  }

  if (isLoading || !trainer) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-text-secondary">
          <Spinner size="sm" />
          Loading trainer...
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = async (values: TrainerFormValues) => {
    await updateTrainerMutation.mutateAsync(values);
    navigate(`/trainers/${trainerId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${trainer.first_name} ${trainer.last_name}`}
        subtitle="Update trainer profile details"
        actions={[
          {
            label: "View Profile",
            variant: "outline",
            onClick: () => navigate(`/trainers/${trainerId}`),
          },
        ]}
      />
      <TrainerForm
        mode="edit"
        isSubmitting={updateTrainerMutation.isPending}
        onSubmit={handleUpdate}
        onCancel={() => navigate(`/trainers/${trainerId}`)}
        initialValues={{
          first_name: trainer.first_name,
          last_name: trainer.last_name,
          father_name: trainer.father_name ?? "",
          mobile_number: trainer.mobile_number,
          whatsapp_number: trainer.whatsapp_number ?? "",
          id_card_number: trainer.id_card_number ?? "",
          email: trainer.email ?? "",
          blood_group: trainer.blood_group ?? undefined,
          date_of_birth: trainer.date_of_birth ?? "",
          date_hired: trainer.date_hired,
          monthly_salary: trainer.monthly_salary,
          salary_currency: trainer.salary_currency,
          salary_status: trainer.salary_status,
          employment_status: trainer.employment_status,
          assigned_classes: trainer.assigned_classes ?? [],
          notes: trainer.notes ?? "",
        }}
        existingProfilePictureUrl={trainer.profile_picture_url}
      />
    </div>
  );
}
