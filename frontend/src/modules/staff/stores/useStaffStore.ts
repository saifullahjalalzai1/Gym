import { create } from "zustand";

import type {
  StaffEmploymentStatus,
  StaffPosition,
  StaffSalaryStatus,
} from "../types/staff";

export type StaffPositionFilter = "all" | StaffPosition;
export type StaffEmploymentStatusFilter = "all" | StaffEmploymentStatus;
export type StaffSalaryStatusFilter = "all" | StaffSalaryStatus;

interface StaffStoreState {
  search: string;
  position: StaffPositionFilter;
  employment_status: StaffEmploymentStatusFilter;
  salary_status: StaffSalaryStatusFilter;
  page: number;
  page_size: number;
  selectedStaffId: number | null;
  setSearch: (search: string) => void;
  setPosition: (position: StaffPositionFilter) => void;
  setEmploymentStatus: (status: StaffEmploymentStatusFilter) => void;
  setSalaryStatus: (status: StaffSalaryStatusFilter) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSelectedStaffId: (id: number | null) => void;
  resetFilters: () => void;
}

export const useStaffStore = create<StaffStoreState>((set) => ({
  search: "",
  position: "all",
  employment_status: "all",
  salary_status: "all",
  page: 1,
  page_size: 25,
  selectedStaffId: null,

  setSearch: (search) => set({ search }),
  setPosition: (position) => set({ position }),
  setEmploymentStatus: (employment_status) => set({ employment_status }),
  setSalaryStatus: (salary_status) => set({ salary_status }),
  setPage: (page) => set({ page }),
  setPageSize: (page_size) => set({ page_size }),
  setSelectedStaffId: (selectedStaffId) => set({ selectedStaffId }),
  resetFilters: () =>
    set({
      search: "",
      position: "all",
      employment_status: "all",
      salary_status: "all",
      page: 1,
      page_size: 25,
    }),
}));
