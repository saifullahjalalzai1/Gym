import apiClient from "@/lib/api";
import type {
  PaginatedTrainersResponse,
  Trainer,
  TrainerFormValues,
  TrainerListParams,
} from "../types/trainer";

const appendValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return;

  if (key === "profile_picture") {
    if (value instanceof FileList) {
      if (value.length > 0) {
        formData.append(key, value[0]);
      }
    } else if (value instanceof File) {
      formData.append(key, value);
    }

    return;
  }

  if (key === "assigned_classes") {
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    }
    return;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    formData.append(key, String(value));
    return;
  }

  if (typeof value === "string") {
    if (!value.trim()) return;
    formData.append(key, value);
    return;
  }

  if (value instanceof File) {
    formData.append(key, value);
  }
};

const toTrainerFormData = (data: Partial<TrainerFormValues>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => appendValue(formData, key, value));
  return formData;
};

export const trainerService = {
  getTrainers: (params?: TrainerListParams) =>
    apiClient.get<PaginatedTrainersResponse>("/trainers/trainers/", { params }),

  getTrainer: (id: number) => apiClient.get<Trainer>(`/trainers/trainers/${id}/`),

  createTrainer: (data: TrainerFormValues) =>
    apiClient.post<Trainer>("/trainers/trainers/", toTrainerFormData(data)),

  updateTrainer: (id: number, data: Partial<TrainerFormValues>) =>
    apiClient.patch<Trainer>(`/trainers/trainers/${id}/`, toTrainerFormData(data)),

  deleteTrainer: (id: number) => apiClient.delete(`/trainers/trainers/${id}/`),

  activateTrainer: (id: number) =>
    apiClient.post<{ message: string }>(`/trainers/trainers/${id}/activate/`),

  deactivateTrainer: (id: number) =>
    apiClient.post<{ message: string }>(`/trainers/trainers/${id}/deactivate/`),
};
