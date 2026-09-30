"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, PhoneCall, UserCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { QueueStatusBadge } from "@/components/queue-status-badge";
import { getQueueStatus } from "@/lib/actions/queue-actions";
import type { Counter, Queue } from "@/lib/types/domain";
import { todayInBangkok } from "@/lib/utils/date";
import { formatDate, localizeName } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

const STATUS_ICON: Record<Queue["status"], React.ElementType> = {
  waiting: Clock,
  called: PhoneCall,
  serving: UserCheck,
  completed: CheckCircle2,
  skipped: XCircle,
  cancelled: XCircle,
};

interface Props {
  initialQueue: Queue;
  serviceName: string;
  counters: Counter[];
  initialPosition: number;
}

export function QueueStatusPanel({
  initialQueue,
  serviceName,
  counters,
  initialPosition,
}: Props) {
  const { locale, t } = useLanguage();
  const [snapshot, setSnapshot] = useState({ queue: initialQueue, position: initialPosition, counterName: counters.find(c => c.id === initialQueue.counter_id)?.name ?? null });
  const [refreshError, setRefreshError] = useState(false);
  const { queue, position, counterName } = snapshot;
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let busy = false;
    const refresh = async () => {
      if (cancelled || busy) return;
      busy = true;
      clearTimeout(timer);
      try {
        if (document.visibilityState === "visible") {
          const result = await getQueueStatus(initialQueue.id);
          if (!cancelled) {
            setSnapshot({ queue: result.queue, position: result.position, counterName: result.queue.counter?.name ?? null });
            setRefreshError(false);
            if (["completed", "skipped", "cancelled"].includes(result.queue.status)) return;
          }
        }
      } catch { if (!cancelled) setRefreshError(true); }
      finally { busy = false; }
      if (!cancelled) timer = setTimeout(refresh, 5_000);
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    timer = setTimeout(refresh, 5_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [initialQueue.id]);

  const Icon = STATUS_ICON[queue.status];
  const today = todayInBangkok();
  const isFutureBooking = queue.queue_date > today;
  const isPastBooking = queue.queue_date < today;
  const almostReady = queue.status === "waiting" && queue.queue_date === today && position <= 3;

  return (
    <div className="flex flex-col gap-4">
      {refreshError && (
        <p className="text-center text-xs text-muted-foreground" role="status">
          {t("อัปเดตไม่สำเร็จ กำลังลองใหม่ ข้อมูลที่แสดงอาจไม่ใช่สถานะล่าสุด", "Kemas kini gagal. Sedang mencuba lagi; status yang dipaparkan mungkin bukan yang terkini")}
        </p>
      )}
      <Card className="overflow-hidden border-[#155b3e] py-0 shadow-[0_25px_60px_-40px_rgba(10,63,39,0.65)]">
        <CardContent className="px-0">
          <div className="flex items-center justify-between gap-3 bg-[#104f36] px-6 py-4 text-white sm:px-8">
            <span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-[#e9be4c]" /> {t("หมายเลขคิวของคุณ", "Nombor giliran anda")}</span>
            <QueueStatusBadge status={queue.status} className="h-7 border border-white/20 bg-white/15 px-3 text-xs text-white">
              <Icon className="size-3.5" />
            </QueueStatusBadge>
          </div>
          <div className="bg-[#104f36] px-6 pb-10 pt-5 text-center text-white sm:px-8 sm:pb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c2e9d0]">{localizeName(serviceName, locale)}</p>
            <p className="mt-2 text-[4.75rem] font-bold leading-none tracking-tight text-white tabular-nums sm:text-[6rem]">{queue.queue_number}</p>
            {queue.customer_name && <p className="mt-4 text-base font-medium text-[#e4f5e9]">{locale === "th" ? "คุณ" : ""}{queue.customer_name}</p>}
          </div>
          <div className="grid bg-white text-center sm:grid-cols-2 sm:divide-x sm:divide-border">
            <div className="px-4 py-4">
              <p className="text-xs text-muted-foreground">{t("วันที่เข้ารับบริการ", "Tarikh lawatan")}</p>
              <p className="mt-1 font-semibold">{formatDate(queue.queue_date, locale)}</p>
            </div>
            <div className="border-t border-border px-4 py-4 sm:border-t-0">
              <p className="text-xs text-muted-foreground">{t("บริการ", "Perkhidmatan")}</p>
              <p className="mt-1 font-semibold">{localizeName(serviceName, locale)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {queue.status === "waiting" && isPastBooking && (
        <Card className="border-warning/40 bg-[#fff9ec] shadow-none">
          <CardContent className="py-5 text-center text-sm text-warning-foreground">
            {t("วันที่จองผ่านไปแล้ว หากยังไม่ได้รับบริการ กรุณารับคิวใหม่", "Tarikh tempahan telah berlalu. Jika anda belum dilayan, sila buat tempahan baharu")}
          </CardContent>
        </Card>
      )}

      {queue.status === "waiting" && !isPastBooking && (
        <Card className={almostReady ? "border-primary/25 bg-accent/40" : "bg-white"}>
          <CardContent className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-semibold">{isFutureBooking ? t("จองคิวสำเร็จแล้ว", "Tempahan berjaya") : t("คิวที่รออยู่ก่อนหน้าคุณ", "Giliran sebelum anda")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{isFutureBooking ? t("คิวจะเริ่มเรียกในวันที่จอง", "Panggilan bermula pada tarikh tempahan") : t("โปรดติดตามสถานะบนหน้านี้", "Sila semak status di halaman ini")}</p>
            </div>
            <p className="text-4xl font-bold text-primary tabular-nums">{position}</p>
          </CardContent>
          {(isFutureBooking || almostReady) && <CardContent className="-mt-2 pb-1 text-xs text-muted-foreground">
            {isFutureBooking && (
              <p>{t("กรุณามาในวันที่จอง ระบบจะเริ่มเรียกคิวในวันนั้น", "Sila hadir pada tarikh tempahan. Giliran akan dipanggil pada hari tersebut")}</p>
            )}
            {almostReady && (
              <p className="font-medium text-primary">
                {t("ใกล้ถึงคิวของคุณแล้ว กรุณาเตรียมตัว", "Giliran anda hampir tiba. Sila bersedia")}
              </p>
            )}
          </CardContent>}
        </Card>
      )}

      {(queue.status === "called" || queue.status === "serving") && (
        <Card className="border-primary/30 bg-accent/50">
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">{t("กรุณาไปที่", "Sila pergi ke")}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{localizeName(counterName, locale)}</p>
          </CardContent>
        </Card>
      )}

      {queue.status === "completed" && (
        <p className="text-center text-sm text-muted-foreground">
          {t("ขอบคุณที่ใช้บริการ", "Terima kasih kerana menggunakan perkhidmatan kami")}
        </p>
      )}
    </div>
  );
}
