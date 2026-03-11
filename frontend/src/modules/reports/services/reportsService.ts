import apiClient from "@/lib/api";

import type {
  ActiveMemberReportItem,
  ActiveMembersReportParams,
  AllowedMonths,
  AnalyticsOverviewResponse,
  Expense,
  ExpenseCreateInput,
  ExpenseListParams,
  MonthlyIncomeReportResponse,
  PaginatedResponse,
  PaymentHistoryReportItem,
  PaymentHistoryReportParams,
  RecentExpenseItem,
  ReportsSummaryResponse,
  UnpaidMemberReportItem,
  UnpaidMembersReportParams,
} from "../types/reports";

export const reportsService = {
  getRecentExpenses: (limit = 10) =>
    apiClient.get<RecentExpenseItem[]>("/reports/expenses/recent/", {
      params: { limit },
    }),

  getExpenses: (params?: ExpenseListParams) =>
    apiClient.get<PaginatedResponse<Expense>>("/reports/expenses/", { params }),

  createExpense: (data: ExpenseCreateInput) =>
    apiClient.post<Expense>("/reports/expenses/", data),

  getActiveMembersReport: (params?: ActiveMembersReportParams) =>
    apiClient.get<PaginatedResponse<ActiveMemberReportItem>>(
      "/reports/members/active/",
      { params }
    ),

  getUnpaidMembersReport: (params?: UnpaidMembersReportParams) =>
    apiClient.get<PaginatedResponse<UnpaidMemberReportItem>>(
      "/reports/members/unpaid/",
      { params }
    ),

  getPaymentHistoryReport: (params?: PaymentHistoryReportParams) =>
    apiClient.get<PaginatedResponse<PaymentHistoryReportItem>>(
      "/reports/payments/history/",
      { params }
    ),

  getMonthlyIncomeReport: (months: AllowedMonths) =>
    apiClient.get<MonthlyIncomeReportResponse>("/reports/income/monthly/", {
      params: { months },
    }),

  getAnalyticsOverview: (months: AllowedMonths) =>
    apiClient.get<AnalyticsOverviewResponse>("/reports/analytics/overview/", {
      params: { months },
    }),

  getSummary: () => apiClient.get<ReportsSummaryResponse>("/reports/summary/"),
};
