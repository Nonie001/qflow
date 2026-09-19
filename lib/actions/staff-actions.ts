"use server";
import { requireStaff } from "@/lib/auth/session";
import { sheets } from "@/lib/sheets/client";
import { notifyQueueCalled, checkAlmostReadyNotifications, safelyNotify } from "@/lib/notifications/notify";
import type { QueueWithRelations } from "@/lib/types/domain";
export async function callNextQueue(counterId: string, _counterName: string, serviceId?: string | null) {
  await requireStaff();
  const queue = await sheets<QueueWithRelations | null>("call_next", { counterId, serviceId });
  if (queue) await safelyNotify(async () => {
    await notifyQueueCalled(queue, queue.counter?.name ?? "");
    await checkAlmostReadyNotifications();
  });
  return queue;
}
async function transition(id: string, operation: string) {
  await requireStaff();
  const queue = await sheets<QueueWithRelations>("transition", { id, operation });
  if (["complete", "skip"].includes(operation)) await safelyNotify(checkAlmostReadyNotifications);
  return queue;
}
export async function recallCurrentQueue(id: string) { return transition(id, "recall"); }
export async function startServingQueue(id: string) { return transition(id, "serve"); }
export async function completeQueue(id: string) { return transition(id, "complete"); }
export async function skipQueue(id: string) { return transition(id, "skip"); }
