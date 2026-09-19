export type QueueStatus =
  | "waiting"
  | "called"
  | "serving"
  | "completed"
  | "skipped"
  | "cancelled";

export type ProfileRole = "staff" | "admin";

export type NotificationType =
  | "queue_created"
  | "queue_almost_ready"
  | "queue_called";

export interface Service {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
}

export interface Counter {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  created_at: string;
}

export interface Queue {
  id: string;
  customer_name: string;
  queue_number: string;
  queue_sequence: number;
  service_id: string;
  counter_id: string | null;
  status: QueueStatus;
  queue_date: string;
  created_at: string;
  called_at: string | null;
  serving_at: string | null;
  completed_at: string | null;
}

export interface QueueWithRelations extends Queue {
  service?: Service | null;
  counter?: Counter | null;
}

export interface PushSubscriptionRow {
  id: string;
  queue_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  queue_id: string;
  type: NotificationType;
  sent_at: string;
}

export const QUEUE_STATUS_LABEL_TH: Record<QueueStatus, string> = {
  waiting: "รอเรียก",
  called: "ถูกเรียกแล้ว",
  serving: "กำลังให้บริการ",
  completed: "เสร็จสิ้น",
  skipped: "ข้ามคิว",
  cancelled: "ยกเลิก",
};

export const ALMOST_READY_THRESHOLD = 3;
