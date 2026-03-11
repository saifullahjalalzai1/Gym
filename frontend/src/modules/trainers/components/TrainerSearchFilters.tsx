import { Search } from "lucide-react";

import Input from "@/components/ui/Input";
import type {
  TrainerEmploymentStatusFilter,
  TrainerSalaryStatusFilter,
} from "../stores/useTrainerStore";

interface TrainerSearchFiltersProps {
  search: string;
  employmentStatus: TrainerEmploymentStatusFilter;
  salaryStatus: TrainerSalaryStatusFilter;
  onSearchChange: (value: string) => void;
  onEmploymentStatusChange: (value: TrainerEmploymentStatusFilter) => void;
  onSalaryStatusChange: (value: TrainerSalaryStatusFilter) => void;
}

export default function TrainerSearchFilters({
  search,
  employmentStatus,
  salaryStatus,
  onSearchChange,
  onEmploymentStatusChange,
  onSalaryStatusChange,
}: TrainerSearchFiltersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search by code, name, mobile or email"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="w-full lg:max-w-md"
          fullWidth={false}
        />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="inline-flex flex-wrap rounded-lg border border-border p-1">
            {(["all", "active", "inactive", "on_leave", "resigned"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onEmploymentStatusChange(item)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  employmentStatus === item
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {item === "all"
                  ? "All Employment"
                  : item === "on_leave"
                    ? "On Leave"
                    : item === "resigned"
                      ? "Resigned"
                      : item === "active"
                        ? "Active"
                        : "Inactive"}
              </button>
            ))}
          </div>

          <div className="inline-flex flex-wrap rounded-lg border border-border p-1">
            {(["all", "paid", "unpaid", "partial"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSalaryStatusChange(item)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  salaryStatus === item
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {item === "all" ? "All Salary" : item === "partial" ? "Partial" : item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
