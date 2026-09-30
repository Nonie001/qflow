import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getCustomerQueue } from "@/lib/queries/queues";
import { QueueStatusPanel } from "@/components/customer/queue-status-panel";
import { NotificationPrompt } from "@/components/customer/notification-prompt";
import { PublicHeader } from "@/components/public-header";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function QueueStatusPage({
  params,
}: PageProps<"/queue/[id]">) {
  const { id } = await params;
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  const result = await getCustomerQueue(id);
  if (!result) notFound();
  const { queue, position } = result;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/queue"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          {t("กลับหน้ารับคิว", "Kembali ke tempahan")}
        </Link>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-primary" /> {t("อัปเดตอัตโนมัติ", "Kemas kini automatik")}</span>
      </div>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("ติดตามสถานะ", "Semak status")}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("คิวของคุณ", "Giliran anda")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("ข้อมูลคิวจะอัปเดตเมื่อหน้านี้เปิดอยู่", "Status giliran dikemas kini selagi halaman ini dibuka")}</p>
      </div>
      <div className="space-y-4">
        <QueueStatusPanel
          key={queue.id}
          initialQueue={queue}
          serviceName={queue.service?.name ?? "-"}
          counters={queue.counter ? [queue.counter] : []}
          initialPosition={position}
        />
        {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && queue.status === "waiting" && <NotificationPrompt queueId={queue.id} />}
      </div>
      </main>
    </>
  );
}
