import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components";
import { Card, CardContent } from "@/components/ui";
import { useMembersList } from "@/modules/members/queries/useMembers";
import ActiveMembersReportTable from "../components/ActiveMembersReportTable";
import AddExpenseModal from "../components/AddExpenseModal";
import ExpenseChart from "../components/ExpenseChart";
import IncomeChart from "../components/IncomeChart";
import MemberGrowthChart from "../components/MemberGrowthChart";
import MonthlyIncomeReportTable from "../components/MonthlyIncomeReportTable";
import PaymentHistoryReportTable from "../components/PaymentHistoryReportTable";
import RecentExpensesTable from "../components/RecentExpensesTable";
import ReportsFilterBar from "../components/ReportsFilterBar";
import UnpaidMembersReportTable from "../components/UnpaidMembersReportTable";
import { useReportsFilters } from "../hooks/useReportsFilters";
import {
  useActiveMembersReport,
  useAnalyticsOverview,
  useCreateExpense,
  useMonthlyIncomeReport,
  usePaymentHistoryReport,
  useRecentExpenses,
  useReportsSummary,
  useUnpaidMembersReport,
} from "../queries/useReports";

const formatMoney = (value?: string) =>
  `AFN ${Number(value ?? "0").toLocaleString()}`;

export default function ReportsDashboardPage() {
  const {
    months,
    paymentMemberId,
    paymentMethod,
    paymentDateFrom,
    paymentDateTo,
    paymentPage,
    paymentPageSize,
    activeSearch,
    activePage,
    activePageSize,
    unpaidSearch,
    unpaidPage,
    unpaidPageSize,
    paymentHistoryParams,
    activeMembersParams,
    unpaidMembersParams,
    updateMonths,
    updatePaymentMember,
    updatePaymentMethod,
    updatePaymentDateFrom,
    updatePaymentDateTo,
    updatePaymentPage,
    updateActiveSearch,
    updateActivePage,
    updateUnpaidSearch,
    updateUnpaidPage,
  } = useReportsFilters();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeSearchInput, setActiveSearchInput] = useState(activeSearch);
  const [unpaidSearchInput, setUnpaidSearchInput] = useState(unpaidSearch);

  useEffect(() => {
    setActiveSearchInput(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    setUnpaidSearchInput(unpaidSearch);
  }, [unpaidSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateActiveSearch(activeSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSearchInput, updateActiveSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUnpaidSearch(unpaidSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [unpaidSearchInput, updateUnpaidSearch]);

  const { data: membersData } = useMembersList({
    page: 1,
    page_size: 200,
    ordering: "last_name",
    status: "active",
  });
  const memberOptions = useMemo(
    () =>
      (membersData?.results ?? []).map((member) => ({
        id: member.id,
        label: `${member.member_code} - ${member.first_name} ${member.last_name}`,
      })),
    [membersData?.results]
  );

  const summaryQuery = useReportsSummary();
  const recentExpensesQuery = useRecentExpenses(10);
  const activeMembersQuery = useActiveMembersReport(activeMembersParams);
  const unpaidMembersQuery = useUnpaidMembersReport(unpaidMembersParams);
  const paymentHistoryQuery = usePaymentHistoryReport(paymentHistoryParams);
  const monthlyIncomeQuery = useMonthlyIncomeReport(months);
  const analyticsQuery = useAnalyticsOverview(months);
  const createExpense = useCreateExpense();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Track expenses, member status, payment history, monthly income and analytics."
      />

      <ReportsFilterBar
        months={months}
        paymentMemberId={paymentMemberId}
        paymentMethod={paymentMethod}
        paymentDateFrom={paymentDateFrom}
        paymentDateTo={paymentDateTo}
        memberOptions={memberOptions}
        onMonthsChange={updateMonths}
        onPaymentMemberChange={updatePaymentMember}
        onPaymentMethodChange={updatePaymentMethod}
        onPaymentDateFromChange={updatePaymentDateFrom}
        onPaymentDateToChange={updatePaymentDateTo}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">Net Income ({months} months)</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {formatMoney(monthlyIncomeQuery.data?.summary.net_received)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">Total Unpaid Balance</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {formatMoney(summaryQuery.data?.total_unpaid_balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">Active Members</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {summaryQuery.data?.active_members_count ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">Current Month Expenses</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {formatMoney(summaryQuery.data?.current_month_expenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      <RecentExpensesTable
        expenses={recentExpensesQuery.data ?? []}
        loading={recentExpensesQuery.isLoading}
        onAddExpense={() => setIsExpenseModalOpen(true)}
      />

      <ActiveMembersReportTable
        rows={activeMembersQuery.data?.results ?? []}
        loading={activeMembersQuery.isLoading}
        search={activeSearchInput}
        onSearchChange={setActiveSearchInput}
        page={activePage}
        pageSize={activePageSize}
        totalItems={activeMembersQuery.data?.count ?? 0}
        onPageChange={updateActivePage}
      />

      <UnpaidMembersReportTable
        rows={unpaidMembersQuery.data?.results ?? []}
        loading={unpaidMembersQuery.isLoading}
        search={unpaidSearchInput}
        onSearchChange={setUnpaidSearchInput}
        page={unpaidPage}
        pageSize={unpaidPageSize}
        totalItems={unpaidMembersQuery.data?.count ?? 0}
        onPageChange={updateUnpaidPage}
      />

      <PaymentHistoryReportTable
        rows={paymentHistoryQuery.data?.results ?? []}
        loading={paymentHistoryQuery.isLoading}
        page={paymentPage}
        pageSize={paymentPageSize}
        totalItems={paymentHistoryQuery.data?.count ?? 0}
        onPageChange={updatePaymentPage}
      />

      <MonthlyIncomeReportTable
        rows={monthlyIncomeQuery.data?.results ?? []}
        loading={monthlyIncomeQuery.isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <IncomeChart data={analyticsQuery.data?.income_series ?? []} />
        <ExpenseChart data={analyticsQuery.data?.expense_series ?? []} />
      </div>
      <MemberGrowthChart data={analyticsQuery.data?.member_growth_series ?? []} />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        isSubmitting={createExpense.isPending}
        onSubmit={async (values) => {
          await createExpense.mutateAsync({
            expense_name: values.expense_name,
            amount: values.amount,
            expense_date: values.expense_date,
            category: values.category,
            note: values.note,
          });
        }}
      />
    </div>
  );
}

