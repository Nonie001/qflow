"use server";
import { after } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { dbAction } from "@/lib/db/client";
import { notifyQueueCalled, checkAlmostReadyNotifications, safelyNotify } from "@/lib/notifications/notify";
import type { QueueWithRelations } from "@/lib/types/domain";
export async function callNextQueue(counterId: string, _counterName: string, serviceId?: string | null) {
  await requireStaff();
  const queue = await dbAction<QueueWithRelations | null>("call_next", { counterId, serviceId });
  if (queue) after(() => safelyNotify(async () => {
    await notifyQueueCalled(queue, queue.counter?.name ?? "");
    await checkAlmostReadyNotifications();
  }));
  return queue;
}
async function transition(id: string, operation: string) {
  await requireStaff();
  const queue = await dbAction<QueueWithRelations>("transition", { id, operation });
  if (["complete", "skip"].includes(operation)) after(() => safelyNotify(checkAlmostReadyNotifications));
  return queue;
}
export async function recallCurrentQueue(id: string) { return transition(id, "recall"); }
export async function startServingQueue(id: string) { return transition(id, "serve"); }
export async function completeQueue(id: string) { return transition(id, "complete"); }
export async function skipQueue(id: string) { return transition(id, "skip"); }
