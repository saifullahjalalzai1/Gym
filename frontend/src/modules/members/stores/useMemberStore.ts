import { create } from "zustand";

import type { MemberStatus } from "../types/member";

export type MemberStatusFilter = "all" | MemberStatus;

interface MemberStoreState {
  search: string;
  status: MemberStatusFilter;
  page: number;
  page_size: number;
  selectedMemberId: number | null;
  setSearch: (search: string) => void;
  setStatus: (status: MemberStatusFilter) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSelectedMemberId: (id: number | null) => void;
  resetFilters: () => void;
}

export const useMemberStore = create<MemberStoreState>((set) => ({
  search: "",
  status: "all",
  page: 1,
  page_size: 25,
  selectedMemberId: null,

  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setPage: (page) => set({ page }),
  setPageSize: (page_size) => set({ page_size }),
  setSelectedMemberId: (selectedMemberId) => set({ selectedMemberId }),
  resetFilters: () =>
    set({
      search: "",
      status: "all",
      page: 1,
      page_size: 25,
    }),
}));
