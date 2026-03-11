import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui";
import type { AnalyticsMemberGrowthPoint } from "../types/reports";

interface MemberGrowthChartProps {
  data: AnalyticsMemberGrowthPoint[];
}

export default function MemberGrowthChart({ data }: MemberGrowthChartProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-base font-semibold text-text-primary">Member Growth Chart</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="new_members"
                stroke="#22c55e"
                fill="#22c55e33"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="cumulative_members"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

