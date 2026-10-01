import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StaffWorkspace } from "@/components/staff/staff-workspace";
import { getQueueMonitorData } from "@/lib/queries/queues";
import { getActiveServices } from "@/lib/queries/services";
import { getLocale } from "@/lib/i18n-server";
import { localizeName, translate } from "@/lib/i18n";

export default async function AdminCallQueuePage({
  searchParams,
}: PageProps<"/admin/call">) {
  const query = await searchParams;
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  const [{ counters, queues }, services] = await Promise.all([getQueueMonitorData(), getActiveServices()]);
  const requestedCounterId = typeof query.counter === "string" ? query.counter : null;
  const counter = counters.find((item) => item.id === requestedCounterId) ?? counters[0];

  if (!counter) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("เรียกคิว", "Panggil giliran")}</h1>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("ยังไม่มีจุดให้บริการที่เปิดใช้งาน", "Tiada kaunter aktif")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const waitingQueues = queues.filter((queue) =>
    queue.status === "waiting" && counter.service_ids.includes(queue.service_id));
  const currentQueue = queues.find(
    (queue) => queue.counter_id === counter.id && ["called", "serving"].includes(queue.status),
  ) ?? null;

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("จัดการคิวหน้าช่อง", "Pengurusan giliran kaunter")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("เรียกคิว", "Panggil giliran")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("เลือกช่องบริการ แล้วเรียกคิวตามลำดับที่รออยู่", "Pilih kaunter, kemudian panggil giliran mengikut turutan")}</p>
        <p className="mt-1 text-sm text-primary">{t("ช่องนี้รับ", "Kaunter ini menerima")}: {services.filter((service) => counter.service_ids.includes(service.id)).map((service) => localizeName(service.name, locale)).join(", ") || t("ยังไม่ได้กำหนดบริการ", "Belum ditetapkan")}</p>
        {counters.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2" aria-label={t("เลือกจุดให้บริการ", "Pilih kaunter")}>
            {counters.map((item) => (
              <Link
                key={item.id}
                href={`/admin/call?counter=${encodeURIComponent(item.id)}`}
                className={buttonVariants({
                  variant: item.id === counter.id ? "default" : "outline",
                  size: "sm",
                })}
              >
                {localizeName(item.name, locale)}
              </Link>
            ))}
          </div>
        )}
      </div>

      <StaffWorkspace
        key={counter.id}
        counter={counter}
        currentQueue={currentQueue}
        waitingQueues={waitingQueues}
      />
    </div>
  );
}
