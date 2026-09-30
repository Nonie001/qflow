"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, PhoneCall, Repeat, Play, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QueueStatusBadge } from "@/components/queue-status-badge";
import { useQueueRefresh } from "@/hooks/use-queue-refresh";
import {
  callNextQueue,
  recallCurrentQueue,
  startServingQueue,
  completeQueue,
  skipQueue,
} from "@/lib/actions/staff-actions";
import type { Counter, QueueWithRelations } from "@/lib/types/domain";
import { useLanguage } from "@/components/language-provider";
import { localizeError, localizeName } from "@/lib/i18n";

interface Props {
  counter: Counter;
  currentQueue: QueueWithRelations | null;
  waitingQueues: QueueWithRelations[];
}

interface WorkspaceView {
  currentQueue: QueueWithRelations | null;
  waitingQueues: QueueWithRelations[];
}

export function StaffWorkspace({
  counter,
  currentQueue,
  waitingQueues,
}: Props) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const serverVersion = `${currentQueue?.id ?? ""}:${currentQueue?.status ?? ""}:${currentQueue?.called_at ?? ""}:${waitingQueues.map((queue) => queue.id).join(",")}`;
  const [override, setOverride] = useState<{ sourceVersion: string; view: WorkspaceView } | null>(null);
  const view = override?.sourceVersion === serverVersion
    ? override.view
    : { currentQueue, waitingQueues };

  function updateView(updater: (previous: WorkspaceView) => WorkspaceView) {
    setOverride((previous) => ({
      sourceVersion: serverVersion,
      view: updater(previous?.sourceVersion === serverVersion
        ? previous.view
        : { currentQueue, waitingQueues }),
    }));
  }

  useQueueRefresh(() => router.refresh());

  function run(
    action: string,
    fn: () => Promise<QueueWithRelations | null>,
    onSuccess: (queue: QueueWithRelations | null) => void,
  ) {
    setBusyAction(action);
    startTransition(async () => {
      try {
        onSuccess(await fn());
      } catch (err) {
        toast.error(err instanceof Error ? localizeError(err.message, locale) : t("ดำเนินการไม่สำเร็จ", "Tindakan gagal"));
      } finally {
        setBusyAction(null);
      }
    });
  }

  const handleCallNext = () =>
    run("call-next", () => callNextQueue(counter.id, counter.name), (queue) => {
      if (!queue) {
        toast.info(t("ไม่มีคิวที่รออยู่", "Tiada giliran menunggu"));
        return;
      }
      updateView((previous) => ({
        currentQueue: queue,
        waitingQueues: previous.waitingQueues.filter((item) => item.id !== queue.id),
      }));
    });

  const handleRecall = () =>
    view.currentQueue && run("recall", () => recallCurrentQueue(view.currentQueue!.id), (queue) => {
      if (queue) updateView((previous) => ({ ...previous, currentQueue: queue }));
    });

  const handleStartServing = () =>
    view.currentQueue && run("start-serving", () => startServingQueue(view.currentQueue!.id), (queue) => {
      if (queue) updateView((previous) => ({ ...previous, currentQueue: queue }));
    });

  const handleComplete = () =>
    view.currentQueue && run("complete", () => completeQueue(view.currentQueue!.id), () => {
      updateView((previous) => ({ ...previous, currentQueue: null }));
    });

  const handleSkip = () =>
    view.currentQueue && run("skip", () => skipQueue(view.currentQueue!.id), () => {
      updateView((previous) => ({ ...previous, currentQueue: null }));
    });

  const activeQueue = view.currentQueue;
  const waitingCount = view.waitingQueues.length;

  return (
    <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-lg font-semibold">
            <span>{t("คิวปัจจุบัน", "Giliran semasa")} · {localizeName(counter.name, locale)}</span>
            <Badge variant="secondary" className="h-7 px-3">{t("รอ", "Menunggu")} {waitingCount} {t("คิว", "giliran")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeQueue ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#104f36] py-9 text-white">
              <span className="mb-2 h-1 w-10 rounded-full bg-[#e9be4c]" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c2e9d0]">{localizeName(activeQueue.service?.name, locale)}</p>
              <p className="text-6xl font-bold tracking-tight text-white tabular-nums">{activeQueue.queue_number}</p>
              <p className="text-base font-medium text-[#e4f5e9]">{activeQueue.customer_name || t("ไม่ระบุชื่อ", "Tiada nama")}</p>
              <QueueStatusBadge status={activeQueue.status} className="mt-2 border border-white/20 bg-white/15 text-white" />
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-muted/30 text-muted-foreground">
              <p className="text-sm">{t("ยังไม่มีคิวที่กำลังให้บริการ", "Tiada giliran sedang dilayan")}</p>
              <p className="text-xs">{t("กดเรียกคิวถัดไปเพื่อเริ่มต้น", "Tekan panggil giliran seterusnya untuk bermula")}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleCallNext}
              disabled={isPending || !!activeQueue}
            >
              {busyAction === "call-next" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PhoneCall className="size-4" />
              )}
              {t("เรียกคิวถัดไป", "Panggil giliran seterusnya")}
            </Button>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                variant="outline"
                onClick={handleRecall}
                disabled={isPending || !activeQueue}
              >
                {busyAction === "recall" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Repeat className="size-4" />
                )}
                {t("เรียกซ้ำ", "Panggil semula")}
              </Button>
              <Button
                variant="outline"
                onClick={handleStartServing}
                disabled={isPending || activeQueue?.status !== "called"}
              >
                {busyAction === "start-serving" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                {t("เริ่มให้บริการ", "Mula melayan")}
              </Button>
              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={isPending || !activeQueue}
              >
                {busyAction === "complete" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {t("เสร็จสิ้น", "Selesai")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleSkip}
                disabled={isPending || !activeQueue}
              >
                {busyAction === "skip" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SkipForward className="size-4" />
                )}
                {t("ข้ามคิว", "Langkau")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>{t("คิวที่กำลังรอ", "Giliran menunggu")}</span><span className="text-xs font-normal text-muted-foreground">{waitingCount} {t("รายการ", "rekod")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {view.waitingQueues.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("ไม่มีคิวที่รออยู่", "Tiada giliran menunggu")}</p>
          ) : (
            <ul className="divide-y">
              {view.waitingQueues.map((q) => (
                <li key={q.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="inline-flex min-w-15 justify-center rounded-lg bg-secondary px-2 py-1 font-bold text-primary">{q.queue_number}</span>
                  <span className="min-w-0 flex-1 truncate">{q.customer_name || t("ไม่ระบุชื่อ", "Tiada nama")}</span>
                  <span className="max-w-24 truncate text-xs text-muted-foreground">{localizeName(q.service?.name, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
