"use server";
import { dbAction } from "@/lib/db/client";
import { grantQueueAccess } from "@/lib/auth/session";
import { getCustomerQueue } from "@/lib/queries/queues";
import type { Queue } from "@/lib/types/domain";
import { addDaysToDate, todayInBangkok } from "@/lib/utils/date";
export interface CreateQueueResult { queue: Queue; position: number }
export async function createQueue(serviceId: string, requestId: string, customerName: string, bookingDate: string): Promise<CreateQueueResult> {
  if (!/^[a-f0-9-]{36}$/i.test(requestId)) throw new Error("Invalid request ID");
  const today = todayInBangkok();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || bookingDate < today || bookingDate > addDaysToDate(today, 30) ||
    Number.isNaN(Date.parse(`${bookingDate}T00:00:00Z`)) || new Date(`${bookingDate}T00:00:00Z`).toISOString().slice(0, 10) !== bookingDate) {
    throw new Error("เลือกวันที่ภายใน 30 วันนับจากวันนี้");
  }
  const normalizedName = customerName.trim();
  if (!normalizedName || normalizedName.length > 100) throw new Error("กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร");
  const result = await dbAction<CreateQueueResult>("create_queue", { serviceId, requestId, customerName: normalizedName, bookingDate });
  await grantQueueAccess(result.queue.id);
  return result;
}
export async function getQueueStatus(id: string) {
  const result = await getCustomerQueue(id);
  if (!result) throw new Error("ไม่พบคิวหรือไม่มีสิทธิ์เข้าถึง กรุณาเปิดจากเบราว์เซอร์ที่รับคิว");
  return result;
}
