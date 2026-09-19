import "server-only";
import webpush from "web-push";
import { sheets } from "@/lib/sheets/client";
import type { PushSubscriptionRow } from "@/lib/types/domain";
export interface PushPayload { title: string; body: string; url?: string }
export function pushConfigured() { return !!(process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY); }
export async function sendPushToQueue(queueId: string, payload: PushPayload): Promise<boolean> {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const subscriptions = await sheets<PushSubscriptionRow[]>("subscriptions", { queueId });
  const results = await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { timeout: 5000 });
      return true;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await sheets("delete_subscription", { id: sub.id });
      return false;
    }
  }));
  return results.some(Boolean);
}
