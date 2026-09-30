import { cache } from "react";
import { dbAction } from "@/lib/db/client";
import { canReadQueue, requireStaff } from "@/lib/auth/session";
import type { Counter, QueueWithRelations } from "@/lib/types/domain";
export type CustomerQueue = { queue: QueueWithRelations; position: number };
export type QueueMonitorData = { counters: Counter[]; queues: QueueWithRelations[] };
export const getCustomerQueue = cache(async (id: string): Promise<CustomerQueue | null> => {
  if (!(await canReadQueue(id))) return null;
  return dbAction<CustomerQueue | null>("customer_queue", { id });
});
export const getTodayAllQueues = cache(async () => {
  await requireStaff();
  return dbAction<QueueWithRelations[]>("today_queues");
});
export const getUpcomingQueues = cache(async (): Promise<QueueWithRelations[]> => {
  await requireStaff();
  return dbAction<QueueWithRelations[]>("upcoming_queues");
});
export const getQueueMonitorData = cache(async (): Promise<QueueMonitorData> => {
  await requireStaff();
  return dbAction<QueueMonitorData>("monitor_data");
});
