import { DashboardStatsView } from "@/components/admin/dashboard-stats";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { todayInBangkok } from "@/lib/utils/date";
import { formatDate, translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("ภาพรวมวันนี้", "Ringkasan hari ini")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("แดชบอร์ด", "Papan pemuka")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("ข้อมูลประจำวันที่", "Data bagi")} {formatDate(todayInBangkok(), locale)}</p>
      </div>
      <DashboardStatsView stats={stats} locale={locale} />
    </div>
  );
}
