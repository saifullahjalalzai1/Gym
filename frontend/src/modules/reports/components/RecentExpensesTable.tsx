import { useMemo } from "react";

import { Button, Card, CardContent, DataTable, type Column } from "@/components/ui";
import type { RecentExpenseItem } from "../types/reports";

interface RecentExpensesTableProps {
  expenses: RecentExpenseItem[];
  loading?: boolean;
  onAddExpense: () => void;
}

const formatMoney = (value: string) => `AFN ${Number(value).toLocaleString()}`;

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return parsed.toLocaleDateString();
};

const formatCategory = (value: string) =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function RecentExpensesTable({
  expenses,
  loading = false,
  onAddExpense,
}: RecentExpensesTableProps) {
  const columns = useMemo<Column<RecentExpenseItem>[]>(
    () => [
      {
        key: "expense_name",
        header: "Expense Name",
        label: "Expense Name",
      },
      {
        key: "amount",
        header: "Amount",
        label: "Amount",
        render: (row) => formatMoney(row.amount),
      },
      {
        key: "expense_date",
        header: "Date",
        label: "Date",
        render: (row) => formatDate(row.expense_date),
      },
      {
        key: "category",
        header: "Category",
        label: "Category",
        render: (row) => formatCategory(row.category),
      },
    ],
    []
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary">Last Expense Report</h3>
          <Button type="button" size="sm" onClick={onAddExpense}>
            Add Expense
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={expenses}
          loading={loading}
          pagination={false}
          emptyMessage="No expenses found."
          getRowKey={(row) => row.id}
        />
      </CardContent>
    </Card>
  );
}

