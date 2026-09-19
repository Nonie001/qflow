import { getTodayAllQueues } from "./queues";
import { requireAdmin } from "@/lib/auth/session";
import { diffMinutes } from "@/lib/utils/date";
import type { QueueWithRelations } from "@/lib/types/domain";

export interface DashboardStats {
  totalToday: number;
  waiting: number;
  completed: number;
  skipped: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  byService: { name: string; count: number }[];
  byCounter: { name: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  const queues = await getTodayAllQueues();

  const waiting = queues.filter((q) => q.status === "waiting").length;
  const completed = queues.filter((q) => q.status === "completed").length;
  const skipped = queues.filter((q) => q.status === "skipped").length;

  const waitTimes = queues
    .filter((q) => q.called_at)
    .map((q) => diffMinutes(q.created_at, q.called_at as string));
  const avgWaitMinutes = average(waitTimes);

  const serviceTimes = queues
    .filter((q) => q.serving_at && q.completed_at)
    .map((q) => diffMinutes(q.serving_at as string, q.completed_at as string));
  const avgServiceMinutes = average(serviceTimes);

  const byService = groupByName(queues, (q) => q.service?.name ?? "-");
  const byCounter = groupByName(
    queues.filter((q) => q.counter),
    (q) => q.counter?.name ?? "-",
  );

  return {
    totalToday: queues.length,
    waiting,
    completed,
    skipped,
    avgWaitMinutes,
    avgServiceMinutes,
    byService,
    byCounter,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function groupByName(
  queues: QueueWithRelations[],
  keyFn: (q: QueueWithRelations) => string,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const q of queues) {
    const key = keyFn(q);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
