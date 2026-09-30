import "server-only";
import { dbAction } from "@/lib/db/client";
import { pushConfigured, sendPushToQueue, type PushPayload } from "./push";
import type { Queue, NotificationType } from "@/lib/types/domain";
import { formatDateTH } from "@/lib/utils/date";
export async function safelyNotify(fn: () => Promise<void>) {
  try { await fn(); } catch { console.error("Push notification failed; queue operation remains committed"); }
}
async function notify(id: string, type: NotificationType, payload: PushPayload) {
  if (!pushConfigured()) return;
  const claim = await dbAction<string | null>("claim_notification", { queueId: id, type });
  if (!claim) return;
  let sent = false;
  try { sent = await sendPushToQueue(id, payload); }
  finally { await dbAction("finish_notification", { id: claim, sent }); }
}
export async function notifyQueueCreated(queue: Queue, position: number): Promise<void> {
  await notify(queue.id, "queue_created", { title: `รับคิว ${queue.queue_number} สำเร็จ / Tempahan berjaya`, body: `${formatDateTH(queue.queue_date)} · ${position} คิวก่อนหน้า / giliran di hadapan`, url: `/queue/${queue.id}` });
}
export async function notifyQueueCalled(queue: Queue, counterName: string): Promise<void> {
  await notify(queue.id, "queue_called", { title: `ถึงคิว ${queue.queue_number} แล้ว / Giliran anda tiba`, body: `กรุณาไปที่ ${counterName} / Sila ke ${counterName}`, url: `/queue/${queue.id}` });
}
export async function checkAlmostReadyNotifications(): Promise<void> {
  if (!pushConfigured()) return;
  const targets = await dbAction<Queue[]>("almost_ready");
  for (const queue of targets) await notify(queue.id, "queue_almost_ready", { title: `ใกล้ถึงคิว ${queue.queue_number} / Giliran hampir tiba`, body: "กรุณาเตรียมตัว / Sila bersedia", url: `/queue/${queue.id}` });
}
