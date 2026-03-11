import {
  Briefcase,
  CircleDollarSign,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

import { DashboardCard } from "@/components";
import { SkeletonCard } from "@/components/ui";
import type { DashboardKeyStatistics } from "../types/dashboard";

interface DashboardStatsGridProps {
  data?: DashboardKeyStatistics;
  loading?: boolean;
  currency?: string;
}

const formatMoney = (value?: string, currency = "AFN") =>
  `${currency} ${Number(value ?? "0").toLocaleString()}`;

export default function DashboardStatsGrid({
  data,
  loading = false,
  currency = "AFN",
}: DashboardStatsGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <DashboardCard
        title="Total Members"
        value={data?.total_members ?? 0}
        icon={Users}
        color="primary"
      />
      <DashboardCard
        title="Active Members"
        value={data?.active_members ?? 0}
        icon={UserCheck}
        color="success"
      />
      <DashboardCard
        title="Expired Members"
        value={data?.expired_members ?? 0}
        icon={UserX}
        color="warning"
      />
      <DashboardCard
        title="Total Staff"
        value={data?.total_staff ?? 0}
        icon={Briefcase}
        color="info"
      />
      <DashboardCard
        title="Monthly Income"
        value={formatMoney(data?.monthly_income, currency)}
        icon={CircleDollarSign}
        color="success"
      />
    </div>
  );
}
