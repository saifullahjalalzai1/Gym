import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractAxiosError } from "@/utils/extractError";
import { trainerService } from "../services/trainerService";
import type {
  PaginatedTrainersResponse,
  Trainer,
  TrainerFormValues,
  TrainerListParams,
} from "../types/trainer";

export const trainerKeys = {
  all: ["trainers"] as const,
  lists: () => [...trainerKeys.all, "list"] as const,
  list: (params?: TrainerListParams) => [...trainerKeys.lists(), params] as const,
  details: () => [...trainerKeys.all, "detail"] as const,
  detail: (id: number) => [...trainerKeys.details(), id] as const,
};

export const useTrainersList = (params?: TrainerListParams) =>
  useQuery<PaginatedTrainersResponse>({
    queryKey: trainerKeys.list(params),
    queryFn: () => trainerService.getTrainers(params).then((res) => res.data),
  });

export const useTrainer = (id: number, options?: { enabled?: boolean }) =>
  useQuery<Trainer>({
    queryKey: trainerKeys.detail(id),
    queryFn: () => trainerService.getTrainer(id).then((res) => res.data),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

export const useCreateTrainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TrainerFormValues) =>
      trainerService.createTrainer(data).then((res) => res.data),
    onSuccess: () => {
      toast.success("Trainer created successfully");
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
    onError: (error) => {
      toast.error(extractAxiosError(error, "Failed to create trainer"));
    },
  });
};

export const useUpdateTrainer = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainerFormValues>) =>
      trainerService.updateTrainer(id, data).then((res) => res.data),
    onSuccess: () => {
      toast.success("Trainer updated successfully");
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
    },
    onError: (error) => {
      toast.error(extractAxiosError(error, "Failed to update trainer"));
    },
  });
};

export const useDeleteTrainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trainerService.deleteTrainer(id),
    onSuccess: () => {
      toast.success("Trainer deleted successfully");
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
    onError: (error) => {
      toast.error(extractAxiosError(error, "Failed to delete trainer"));
    },
  });
};

export const useActivateTrainer = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => trainerService.activateTrainer(id).then((res) => res.data),
    onSuccess: () => {
      toast.success("Trainer activated");
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
    },
    onError: (error) => {
      toast.error(extractAxiosError(error, "Failed to activate trainer"));
    },
  });
};

export const useDeactivateTrainer = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => trainerService.deactivateTrainer(id).then((res) => res.data),
    onSuccess: () => {
      toast.success("Trainer deactivated");
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trainerKeys.detail(id) });
    },
    onError: (error) => {
      toast.error(extractAxiosError(error, "Failed to deactivate trainer"));
    },
  });
};
