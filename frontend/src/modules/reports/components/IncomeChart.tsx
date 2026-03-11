import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui";
import type { AnalyticsIncomePoint } from "../types/reports";

interface IncomeChartProps {
  data: AnalyticsIncomePoint[];
}

export default function IncomeChart({ data }: IncomeChartProps) {
  const chartData = data.map((point) => ({
    month: point.month,
    value: Number(point.value),
  }));

  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-text-primary">Income Chart</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `AFN ${Number(value).toLocaleString()}`} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

