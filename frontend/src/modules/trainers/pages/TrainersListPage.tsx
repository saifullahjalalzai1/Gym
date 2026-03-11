import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components";
import { Card, CardContent, Pagination, PaginationInfo } from "@/components/ui";
import TrainerSearchFilters from "../components/TrainerSearchFilters";
import TrainersTable from "../components/TrainersTable";
import { useTrainerFilters } from "../hooks/useTrainerFilters";
import { useTrainersList } from "../queries/useTrainers";

export default function TrainersListPage() {
  const navigate = useNavigate();
  const {
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
  } = useTrainerFilters();
  const { data, isLoading } = useTrainersList(listParams);
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
        title="Trainers"
        subtitle="Manage gym trainers and assignments"
        actions={[
          {
            label: "Add Trainer",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => navigate("/trainers/new"),
          },
        ]}
      />

      <TrainerSearchFilters
        search={searchInput}
        employmentStatus={employment_status}
        salaryStatus={salary_status}
        onSearchChange={setSearchInput}
        onEmploymentStatusChange={updateEmploymentStatus}
        onSalaryStatusChange={updateSalaryStatus}
      />

      <Card>
        <CardContent className="space-y-4">
          <TrainersTable
            trainers={data?.results ?? []}
            loading={isLoading}
            onRowClick={(trainer) => navigate(`/trainers/${trainer.id}`)}
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
