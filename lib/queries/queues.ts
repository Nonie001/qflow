import { cache } from "react";
import { sheets } from "@/lib/sheets/client";
import { canReadQueue, requireStaff } from "@/lib/auth/session";
import type { Counter, QueueWithRelations } from "@/lib/types/domain";
export type CustomerQueue = { queue: QueueWithRelations; position: number };
export type QueueMonitorData = { counters: Counter[]; queues: QueueWithRelations[] };
export const getCustomerQueue = cache(async (id: string): Promise<CustomerQueue | null> => {
  if (!(await canReadQueue(id))) return null;
  return sheets<CustomerQueue | null>("customer_queue", { id });
});
export async function getQueueById(id: string) { return (await getCustomerQueue(id))?.queue ?? null; }
export async function getQueuePosition(id: string) { return (await getCustomerQueue(id))?.position ?? 0; }
export const getTodayAllQueues = cache(async () => {
  await requireStaff();
  return sheets<QueueWithRelations[]>("today_queues");
});
export const getQueueMonitorData = cache(async (): Promise<QueueMonitorData> => {
  await requireStaff();
  try {
    return await sheets<QueueMonitorData>("monitor_data");
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Unknown action") throw error;
    const [counters, queues] = await Promise.all([
      sheets<Counter[]>("counters", { activeOnly: true }),
      sheets<QueueWithRelations[]>("today_queues"),
    ]);
    return { counters, queues };
  }
});
export async function getTodayWaitingQueues(serviceId?: string) {
  return (await getTodayAllQueues()).filter(q => q.status === "waiting" && (!serviceId || q.service_id === serviceId));
}
export async function getCounterCurrentQueue(counterId: string) {
  return (await getTodayAllQueues()).find(q => q.counter_id === counterId && ["called", "serving"].includes(q.status)) ?? null;
}
export async function getRecentCalledQueues(limit = 5) {
  const queues = (await getTodayAllQueues()).filter(q => q.called_at)
    .sort((a,b) => (b.called_at ?? "").localeCompare(a.called_at ?? ""));
  // Keep all active counters on screen, even when their calls are older than the history limit.
  return queues.filter((q, index) => index < limit || ["called", "serving"].includes(q.status));
}
