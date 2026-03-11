import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import { Card, CardContent, Pagination, PaginationInfo } from "@/components/ui";
import MemberSearchFilters from "../components/MemberSearchFilters";
import MembersTable from "../components/MembersTable";
import { useMemberFilters } from "../hooks/useMemberFilters";
import { useMembersList } from "../queries/useMembers";

export default function MembersListPage() {
  const navigate = useNavigate();
  const { search, status, page, page_size, listParams, updateSearch, updateStatus, updatePage } =
    useMemberFilters();
  const { data, isLoading } = useMembersList(listParams);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, updateSearch]);

  const totalPages = useMemo(() => {
    if (!data?.count) return 1;
    return Math.max(1, Math.ceil(data.count / page_size));
  }, [data?.count, page_size]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        subtitle="Manage gym members and profiles"
        actions={[
          {
            label: "Add Member",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => navigate("/members/new"),
          },
        ]}
      />

      <MemberSearchFilters
        search={searchInput}
        status={status}
        onSearchChange={setSearchInput}
        onStatusChange={updateStatus}
      />

      <Card>
        <CardContent className="space-y-4">
          <MembersTable
            members={data?.results ?? []}
            loading={isLoading}
            onRowClick={(member) => navigate(`/members/${member.id}`)}
          />

          <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
            <PaginationInfo
              currentPage={page}
              pageSize={page_size}
              totalItems={data?.count ?? 0}
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => updatePage(nextPage)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
