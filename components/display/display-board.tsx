"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Volume2 } from "lucide-react";
import { useQueueRefresh } from "@/hooks/use-queue-refresh";
import type { Counter, Queue, QueueWithRelations } from "@/lib/types/domain";

interface Props {
  recentCalls: QueueWithRelations[];
  counters: Counter[];
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function DisplayBoard({ recentCalls, counters }: Props) {
  const router = useRouter();
  const lastAnnouncedRef = useRef<string | null>(null);

  const announce = useCallback(
    (queue: Queue) => {
      if (lastAnnouncedRef.current === `${queue.id}-${queue.called_at}`) return;
      lastAnnouncedRef.current = `${queue.id}-${queue.called_at}`;

      const counterName = counters.find((c) => c.id === queue.counter_id)?.name;
      speak(`เชิญหมายเลข ${queue.queue_number.split("").join(" ")} ที่${counterName ?? ""}`);
    },
    [counters],
  );

  useQueueRefresh(() => router.refresh());
  const seenCalls = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    const previous = seenCalls.current;
    seenCalls.current = new Map(recentCalls.map(q => [q.id, q.called_at ?? ""]));
    if (!previous) return;
    for (const queue of [...recentCalls].reverse()) {
      if (["called", "serving"].includes(queue.status) && queue.called_at && previous.get(queue.id) !== queue.called_at) announce(queue);
    }
  }, [recentCalls, announce]);

  const currentByCounter = counters
    .map((counter) => ({
      counter,
      queue: recentCalls.find(
        (q) => q.counter_id === counter.id && (q.status === "called" || q.status === "serving"),
      ),
    }))
    .filter((entry) => entry.queue);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 px-8 py-10 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-64 -z-10 h-128 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--warning),transparent_88%),transparent)]"
      />

      <div className="mb-8 flex items-center justify-center gap-3">
        <span className="inline-flex size-2 animate-pulse rounded-full bg-warning" />
        <h1 className="text-3xl font-semibold tracking-wide text-slate-700">กำลังเรียกคิว</h1>
      </div>

      {currentByCounter.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
          <Volume2 className="size-10" />
          <p className="text-2xl">ยังไม่มีคิวที่ถูกเรียก</p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 content-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentByCounter.map(({ counter, queue }) => (
            <div
              key={counter.id}
              className="flex flex-col items-center justify-center rounded-3xl border bg-white py-12 shadow-xl shadow-slate-200/70 ring-1 ring-warning/20"
            >
              <p className="mb-3 text-2xl font-medium text-slate-500">
                {queue!.service?.name ?? "บริการ"}
              </p>
              <p className="text-8xl font-bold tabular-nums text-warning">
                {queue!.queue_number}
              </p>
              <p className="mt-4 text-2xl text-slate-600">{counter.name}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-medium text-slate-500">เรียกล่าสุด</h2>
        <div className="flex flex-wrap gap-3">
          {recentCalls.slice(0, 5).map((q) => (
            <div
              key={q.id}
              className="rounded-xl border bg-white px-5 py-3 text-xl font-semibold tabular-nums text-slate-700 shadow-sm"
            >
              {q.queue_number}
              <span className="ml-2 text-sm font-normal text-slate-500">
                {q.service?.name ?? "บริการ"} · {q.counter?.name ?? "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
