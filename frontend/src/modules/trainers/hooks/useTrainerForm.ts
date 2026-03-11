import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { trainerFormSchema } from "../schemas/trainerSchemas";
import type { TrainerFormValues } from "../types/trainer";

const getDefaultDateHired = () => new Date().toISOString().slice(0, 10);

export type UseTrainerFormResult = UseFormReturn<TrainerFormValues>;

export const useTrainerForm = (
  initialValues?: Partial<TrainerFormValues>
): UseTrainerFormResult => {
  return useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema) as Resolver<TrainerFormValues>,
    defaultValues: {
      first_name: initialValues?.first_name ?? "",
      last_name: initialValues?.last_name ?? "",
      father_name: initialValues?.father_name ?? "",
      mobile_number: initialValues?.mobile_number ?? "",
      whatsapp_number: initialValues?.whatsapp_number ?? "",
      id_card_number: initialValues?.id_card_number ?? "",
      email: initialValues?.email ?? "",
      blood_group: initialValues?.blood_group ?? undefined,
      profile_picture: null,
      date_of_birth: initialValues?.date_of_birth ?? "",
      date_hired: initialValues?.date_hired ?? getDefaultDateHired(),
      monthly_salary: initialValues?.monthly_salary as number | undefined,
      salary_currency: initialValues?.salary_currency ?? "AFN",
      salary_status: initialValues?.salary_status ?? "unpaid",
      employment_status: initialValues?.employment_status ?? "active",
      assigned_classes: initialValues?.assigned_classes ?? [],
      notes: initialValues?.notes ?? "",
    },
  });
};
