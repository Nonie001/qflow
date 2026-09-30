import type { LucideIcon } from "lucide-react";
import { ListChecks, Clock, CheckCircle2, SkipForward, Timer, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/queries/dashboard";
import { localizeName, translate, type Locale } from "@/lib/i18n";

const STAT_CARDS = (stats: DashboardStats, locale: Locale): { label: string; value: number; icon: LucideIcon }[] => [
  { label: translate(locale, "คิวทั้งหมดวันนี้", "Jumlah giliran hari ini"), value: stats.totalToday, icon: ListChecks },
  { label: translate(locale, "กำลังรอ", "Menunggu"), value: stats.waiting, icon: Clock },
  { label: translate(locale, "ให้บริการเสร็จแล้ว", "Selesai dilayan"), value: stats.completed, icon: CheckCircle2 },
  { label: translate(locale, "ถูกข้าม", "Dilangkau"), value: stats.skipped, icon: SkipForward },
  { label: translate(locale, "เวลารอเฉลี่ย (นาที)", "Purata masa menunggu (minit)"), value: stats.avgWaitMinutes, icon: Hourglass },
  { label: translate(locale, "เวลาให้บริการเฉลี่ย (นาที)", "Purata masa layanan (minit)"), value: stats.avgServiceMinutes, icon: Timer },
];

export function DashboardStatsView({ stats, locale }: { stats: DashboardStats; locale: Locale }) {
  const t = (th: string, ms: string) => translate(locale, th, ms);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {STAT_CARDS(stats, locale).map((item, index) => (
          <Card key={item.label} className={index === 0 ? "border-primary bg-[#155b3e] text-white" : "shadow-none"}>
            <CardContent className="flex min-h-32 flex-col justify-between gap-3 py-1">
              <div className={`flex size-9 items-center justify-center rounded-xl ${index === 0 ? "bg-white/15 text-white" : "bg-secondary text-primary"}`}>
                <item.icon className="size-4" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">{item.value}</p>
                <p className={`mt-1 text-xs ${index === 0 ? "text-white/80" : "text-muted-foreground"}`}>{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("คิวแยกตามบริการ", "Giliran mengikut perkhidmatan")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byService.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ไม่มีข้อมูล", "Tiada data")}</p>
            ) : (
              <ul className="space-y-4 text-sm">
                {stats.byService.map((row) => (
                  <li key={row.name}>
                    <div className="mb-2 flex justify-between gap-3">
                      <span>{localizeName(row.name, locale)}</span>
                      <span className="font-semibold tabular-nums">{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(row.count / Math.max(stats.totalToday, 1) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("คิวแยกตามช่องบริการ", "Giliran mengikut kaunter")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byCounter.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ไม่มีข้อมูล", "Tiada data")}</p>
            ) : (
              <ul className="space-y-4 text-sm">
                {stats.byCounter.map((row) => (
                  <li key={row.name}>
                    <div className="mb-2 flex justify-between gap-3">
                      <span>{localizeName(row.name, locale)}</span>
                      <span className="font-semibold tabular-nums">{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(row.count / Math.max(stats.totalToday, 1) * 100)}%` }} />
                    </div>
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
