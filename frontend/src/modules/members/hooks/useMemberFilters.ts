import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useMemberStore, type MemberStatusFilter } from "../stores/useMemberStore";
import type { MemberListParams } from "../types/member";

const VALID_STATUS: MemberStatusFilter[] = ["all", "active", "inactive"];

const parseIntOrDefault = (value: string | null, defaultValue: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
};

export const useMemberFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    search,
    status,
    page,
    page_size,
    setSearch,
    setStatus,
    setPage,
    setPageSize,
  } = useMemberStore();

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    const urlStatus = searchParams.get("status") ?? "all";
    const urlPage = parseIntOrDefault(searchParams.get("page"), 1);
    const urlPageSize = parseIntOrDefault(searchParams.get("page_size"), 25);

    const normalizedStatus = VALID_STATUS.includes(urlStatus as MemberStatusFilter)
      ? (urlStatus as MemberStatusFilter)
      : "all";

    if (search !== urlSearch) setSearch(urlSearch);
    if (status !== normalizedStatus) setStatus(normalizedStatus);
    if (page !== urlPage) setPage(urlPage);
    if (page_size !== urlPageSize) setPageSize(urlPageSize);
  }, [
    page,
    page_size,
    search,
    searchParams,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    status,
  ]);

  const updateSearch = useCallback((value: string) => {
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
  }, [setPage, setSearch, setSearchParams]);

  const updateStatus = useCallback((value: MemberStatusFilter) => {
    setStatus(value);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "all") {
        next.delete("status");
      } else {
        next.set("status", value);
      }
      next.set("page", "1");
      return next;
    });
  }, [setPage, setSearchParams, setStatus]);

  const updatePage = useCallback((value: number) => {
    setPage(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(value));
      return next;
    });
  }, [setPage, setSearchParams]);

  const listParams: MemberListParams = {
    page,
    page_size,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  };

  return {
    search,
    status,
    page,
    page_size,
    listParams,
    updateSearch,
    updateStatus,
    updatePage,
  };
};
