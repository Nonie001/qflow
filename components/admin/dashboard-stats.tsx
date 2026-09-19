import type { LucideIcon } from "lucide-react";
import { ListChecks, Clock, CheckCircle2, SkipForward, Timer, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/queries/dashboard";

const STAT_CARDS = (stats: DashboardStats): { label: string; value: number; icon: LucideIcon }[] => [
  { label: "คิวทั้งหมดวันนี้", value: stats.totalToday, icon: ListChecks },
  { label: "กำลังรอ", value: stats.waiting, icon: Clock },
  { label: "ให้บริการเสร็จแล้ว", value: stats.completed, icon: CheckCircle2 },
  { label: "ถูกข้าม", value: stats.skipped, icon: SkipForward },
  { label: "เวลารอเฉลี่ย (นาที)", value: stats.avgWaitMinutes, icon: Hourglass },
  { label: "เวลาให้บริการเฉลี่ย (นาที)", value: stats.avgServiceMinutes, icon: Timer },
];

export function DashboardStatsView({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS(stats).map((item) => (
          <Card key={item.label}>
            <CardContent className="flex flex-col gap-2 py-1">
              <item.icon className="size-4 text-primary" />
              <p className="text-2xl font-bold tabular-nums">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">จำนวนคิวแยกตามบริการ</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byService.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {stats.byService.map((row) => (
                  <li key={row.name} className="flex justify-between">
                    <span>{row.name}</span>
                    <span className="font-medium tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">จำนวนคิวแยกตามช่องบริการ</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byCounter.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {stats.byCounter.map((row) => (
                  <li key={row.name} className="flex justify-between">
                    <span>{row.name}</span>
                    <span className="font-medium tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
