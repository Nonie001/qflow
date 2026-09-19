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
        toast.error(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
      } finally {
        setBusyAction(null);
      }
    });
  }

  const handleCallNext = () =>
    run("call-next", () => callNextQueue(counter.id, counter.name), (queue) => {
      if (!queue) {
        toast.info("ไม่มีคิวที่รออยู่");
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{counter.name}</span>
            <Badge variant="secondary">คิวที่รอทั้งหมด {waitingCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeQueue ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-linear-to-b from-primary/10 to-transparent py-7">
              <p className="text-sm text-muted-foreground">{activeQueue.service?.name}</p>
              <p className="text-5xl font-bold tabular-nums">{activeQueue.queue_number}</p>
              <p className="text-base font-medium">{activeQueue.customer_name || "ไม่ระบุชื่อ"}</p>
              <QueueStatusBadge status={activeQueue.status} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-7 text-muted-foreground">
              <p>ยังไม่มีคิวที่กำลังให้บริการ</p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
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
              เรียกคิวถัดไป
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
                เรียกซ้ำ
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
                เริ่มให้บริการ
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
                เสร็จสิ้น
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
                ข้ามคิว
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">คิวที่กำลังรอ</CardTitle>
        </CardHeader>
        <CardContent>
          {view.waitingQueues.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีคิวที่รออยู่</p>
          ) : (
            <ul className="divide-y">
              {view.waitingQueues.map((q) => (
                <li key={q.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="font-medium">{q.queue_number}</span>
                  <span className="min-w-0 flex-1 truncate">{q.customer_name || "ไม่ระบุชื่อ"}</span>
                  <span className="text-muted-foreground">{q.service?.name}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
