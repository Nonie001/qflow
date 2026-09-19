import { DashboardStatsView } from "@/components/admin/dashboard-stats";
import { getDashboardStats } from "@/lib/queries/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
      <DashboardStatsView stats={stats} />
    </div>
  );
}
