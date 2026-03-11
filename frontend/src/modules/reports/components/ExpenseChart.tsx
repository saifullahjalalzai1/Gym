import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui";
import type { AnalyticsExpensePoint } from "../types/reports";

interface ExpenseChartProps {
  data: AnalyticsExpensePoint[];
}

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = data.map((point) => ({
    month: point.month,
    value: Number(point.value),
  }));

  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-text-primary">Expense Chart</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `AFN ${Number(value).toLocaleString()}`} />
              <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

