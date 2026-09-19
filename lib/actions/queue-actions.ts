"use server";
import { sheets } from "@/lib/sheets/client";
import { canReadQueue, grantQueueAccess } from "@/lib/auth/session";
import { getCustomerQueue } from "@/lib/queries/queues";
import { notifyQueueCreated, safelyNotify } from "@/lib/notifications/notify";
import type { Queue } from "@/lib/types/domain";
export interface CreateQueueResult { queue: Queue; position: number }
export async function createQueue(serviceId: string, requestId: string, customerName: string): Promise<CreateQueueResult> {
  if (!/^[a-f0-9-]{36}$/i.test(requestId)) throw new Error("Invalid request ID");
  const normalizedName = customerName.trim();
  if (!normalizedName || normalizedName.length > 100) throw new Error("กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร");
  const result = await sheets<CreateQueueResult>("create_queue", { serviceId, requestId, customerName: normalizedName });
  await grantQueueAccess(result.queue.id);
  return result;
}
export async function getQueueStatus(id: string) {
  const result = await getCustomerQueue(id);
  if (!result) throw new Error("ไม่พบคิวหรือไม่มีสิทธิ์เข้าถึง กรุณาเปิดจากเบราว์เซอร์ที่รับคิว");
  return result;
}
export async function getQueuePosition(id: string) { return (await getQueueStatus(id)).position; }
export interface PushSubscriptionInput { endpoint: string; p256dh: string; auth: string }
export async function subscribeToPush(queueId: string, subscription: PushSubscriptionInput): Promise<void> {
  if (!(await canReadQueue(queueId))) throw new Error("ไม่มีสิทธิ์เข้าถึงคิวนี้");
  const endpoint = new URL(subscription.endpoint);
  const host = endpoint.hostname;
  const allowed = host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" ||
    host.endsWith(".push.services.mozilla.com") || host === "web.push.apple.com" || host.endsWith(".notify.windows.com");
  if (endpoint.protocol !== "https:" || endpoint.port || endpoint.username || endpoint.password || !allowed) throw new Error("Unsupported push endpoint");
  if (!/^[A-Za-z0-9_-]{80,100}$/.test(subscription.p256dh) || !/^[A-Za-z0-9_-]{20,30}$/.test(subscription.auth)) throw new Error("Invalid push keys");
  await sheets("subscribe", { queueId, ...subscription });
  const result = await getQueueStatus(queueId);
  await safelyNotify(() => notifyQueueCreated(result.queue, result.position));
}
