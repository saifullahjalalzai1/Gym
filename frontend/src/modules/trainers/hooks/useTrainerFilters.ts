import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import {
  useTrainerStore,
  type TrainerEmploymentStatusFilter,
  type TrainerSalaryStatusFilter,
} from "../stores/useTrainerStore";
import type { TrainerListParams } from "../types/trainer";

const VALID_EMPLOYMENT_STATUS: TrainerEmploymentStatusFilter[] = [
  "all",
  "active",
  "inactive",
  "on_leave",
  "resigned",
];
const VALID_SALARY_STATUS: TrainerSalaryStatusFilter[] = ["all", "paid", "unpaid", "partial"];

const parseIntOrDefault = (value: string | null, defaultValue: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
};

export const useTrainerFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    search,
    employment_status,
    salary_status,
    page,
    page_size,
    setSearch,
    setEmploymentStatus,
    setSalaryStatus,
    setPage,
    setPageSize,
  } = useTrainerStore();

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    const urlEmploymentStatus = searchParams.get("employment_status") ?? "all";
    const urlSalaryStatus = searchParams.get("salary_status") ?? "all";
    const urlPage = parseIntOrDefault(searchParams.get("page"), 1);
    const urlPageSize = parseIntOrDefault(searchParams.get("page_size"), 25);

    const normalizedEmploymentStatus = VALID_EMPLOYMENT_STATUS.includes(
      urlEmploymentStatus as TrainerEmploymentStatusFilter
    )
      ? (urlEmploymentStatus as TrainerEmploymentStatusFilter)
      : "all";
    const normalizedSalaryStatus = VALID_SALARY_STATUS.includes(
      urlSalaryStatus as TrainerSalaryStatusFilter
    )
      ? (urlSalaryStatus as TrainerSalaryStatusFilter)
      : "all";

    if (search !== urlSearch) setSearch(urlSearch);
    if (employment_status !== normalizedEmploymentStatus) {
      setEmploymentStatus(normalizedEmploymentStatus);
    }
    if (salary_status !== normalizedSalaryStatus) {
      setSalaryStatus(normalizedSalaryStatus);
    }
    if (page !== urlPage) setPage(urlPage);
    if (page_size !== urlPageSize) setPageSize(urlPageSize);
  }, [
    employment_status,
    page,
    page_size,
    salary_status,
    search,
    searchParams,
    setEmploymentStatus,
    setPage,
    setPageSize,
    setSalaryStatus,
    setSearch,
  ]);

  const updateSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value.trim()) {
          next.set("search", value.trim());
        } else {
          next.delete("search");
        }
        next.set("page", "1");
        return next;
      });
    },
    [setPage, setSearch, setSearchParams]
  );

  const updateEmploymentStatus = useCallback(
    (value: TrainerEmploymentStatusFilter) => {
      setEmploymentStatus(value);
      setPage(1);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "all") {
          next.delete("employment_status");
        } else {
          next.set("employment_status", value);
        }
        next.set("page", "1");
        return next;
      });
    },
    [setEmploymentStatus, setPage, setSearchParams]
  );

  const updateSalaryStatus = useCallback(
    (value: TrainerSalaryStatusFilter) => {
      setSalaryStatus(value);
      setPage(1);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "all") {
          next.delete("salary_status");
        } else {
          next.set("salary_status", value);
        }
        next.set("page", "1");
        return next;
      });
    },
    [setPage, setSalaryStatus, setSearchParams]
  );

  const updatePage = useCallback(
    (value: number) => {
      setPage(value);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(value));
        return next;
      });
    },
    [setPage, setSearchParams]
  );

  const listParams: TrainerListParams = {
    page,
    page_size,
    search: search || undefined,
    employment_status: employment_status === "all" ? undefined : employment_status,
    salary_status: salary_status === "all" ? undefined : salary_status,
  };

  return {
    search,
    employment_status,
    salary_status,
    page,
    page_size,
    listParams,
    updateSearch,
    updateEmploymentStatus,
    updateSalaryStatus,
    updatePage,
  };
};
