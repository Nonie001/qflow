"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, PhoneCall, UserCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { QueueStatusBadge } from "@/components/queue-status-badge";
import { getQueueStatus } from "@/lib/actions/queue-actions";
import type { Counter, Queue } from "@/lib/types/domain";

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
      if (!cancelled) timer = setTimeout(refresh, 10_000);
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    timer = setTimeout(refresh, 10_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [initialQueue.id]);

  const Icon = STATUS_ICON[queue.status];
  const almostReady = queue.status === "waiting" && position <= 3;

  return (
    <div className="flex flex-col gap-4">
      {refreshError && (
        <p className="text-center text-xs text-muted-foreground" role="status">
          อัปเดตไม่สำเร็จ กำลังลองใหม่ ข้อมูลที่แสดงอาจไม่ใช่สถานะล่าสุด
        </p>
      )}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-3 bg-linear-to-b from-primary/5 to-transparent py-10 text-center">
          <p className="text-sm text-muted-foreground">{serviceName}</p>
          <p className="text-7xl font-bold tracking-tight tabular-nums">{queue.queue_number}</p>
          {queue.customer_name && <p className="font-medium">คุณ{queue.customer_name}</p>}
          <QueueStatusBadge status={queue.status} className="text-sm">
            <Icon className="size-3.5" />
          </QueueStatusBadge>
        </CardContent>
      </Card>

      {queue.status === "waiting" && (
        <Card className={almostReady ? "border-warning/40 bg-warning/10" : undefined}>
          <CardContent className="py-5 text-center">
            <p className="text-4xl font-bold tabular-nums">{position}</p>
            <p className="text-sm text-muted-foreground">คิวที่รออยู่ก่อนหน้าคุณ</p>
            {almostReady && (
              <p className="mt-2 text-sm font-medium text-warning-foreground">
                ใกล้ถึงคิวของคุณแล้ว กรุณาเตรียมตัว
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(queue.status === "called" || queue.status === "serving") && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">กรุณาไปที่</p>
            <p className="text-2xl font-semibold">{counterName ?? "-"}</p>
          </CardContent>
        </Card>
      )}

      {queue.status === "completed" && (
        <p className="text-center text-sm text-muted-foreground">
          ขอบคุณที่ใช้บริการ
        </p>
      )}
    </div>
  );
}
