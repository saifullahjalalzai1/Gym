import { create } from "zustand";

import type { TrainerEmploymentStatus, TrainerSalaryStatus } from "../types/trainer";

export type TrainerEmploymentStatusFilter = "all" | TrainerEmploymentStatus;
export type TrainerSalaryStatusFilter = "all" | TrainerSalaryStatus;

interface TrainerStoreState {
  search: string;
  employment_status: TrainerEmploymentStatusFilter;
  salary_status: TrainerSalaryStatusFilter;
  page: number;
  page_size: number;
  selectedTrainerId: number | null;
  setSearch: (search: string) => void;
  setEmploymentStatus: (status: TrainerEmploymentStatusFilter) => void;
  setSalaryStatus: (status: TrainerSalaryStatusFilter) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSelectedTrainerId: (id: number | null) => void;
  resetFilters: () => void;
}

export const useTrainerStore = create<TrainerStoreState>((set) => ({
  search: "",
  employment_status: "all",
  salary_status: "all",
  page: 1,
  page_size: 25,
  selectedTrainerId: null,

  setSearch: (search) => set({ search }),
  setEmploymentStatus: (employment_status) => set({ employment_status }),
  setSalaryStatus: (salary_status) => set({ salary_status }),
  setPage: (page) => set({ page }),
  setPageSize: (page_size) => set({ page_size }),
  setSelectedTrainerId: (selectedTrainerId) => set({ selectedTrainerId }),
  resetFilters: () =>
    set({
      search: "",
      employment_status: "all",
      salary_status: "all",
      page: 1,
      page_size: 25,
    }),
}));
