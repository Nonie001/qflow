import "server-only";
import { randomUUID } from "node:crypto";
import { Pool, types, type PoolClient } from "pg";
import type { Counter, Queue, QueueWithRelations, Service, PushSubscriptionRow } from "@/lib/types/domain";
import { addDaysToDate, todayInBangkok } from "@/lib/utils/date";

type Db = Pool | PoolClient;
type Arguments = Record<string, unknown>;
type Booking = { queue: QueueWithRelations; position: number };

let pool: Pool | undefined;

// Queue times are sent through Server Components and compared as ISO strings.
types.setTypeParser(1184, (value) => new Date(value).toISOString());
types.setTypeParser(1082, (value) => value);

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("กรุณาตั้งค่า DATABASE_URL ของ Supabase ตาม README ก่อนใช้งาน");
  pool ??= new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 });
  return pool;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL ||
    (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY));
}

async function supabaseAction<T>(action: string, args: Arguments): Promise<T> {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) throw new Error("กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(new URL("/rest/v1/rpc/qflow_action", baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p_action: action, p_args: args }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => null) as { code?: string; message?: string } | null;
  if (!response.ok) {
    if (result?.code === "PGRST202" || result?.code === "42883") {
      throw new Error("กรุณารัน supabase/migrations/001_initial.sql และ 002_api.sql ใน Supabase SQL Editor");
    }
    const error = new Error(result?.message || "เชื่อมต่อ Supabase ไม่สำเร็จ");
    (error as Error & { code?: string }).code = result?.code;
    throw error;
  }
  return result as T;
}

async function rows<T>(db: Db, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await db.query(sql, params);
  return result.rows as T[];
}

async function transaction<T>(work: (db: PoolClient) => Promise<T>): Promise<T> {
  const client = await database().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function value(input: unknown, max: number): string {
  if (typeof input !== "string" || !input.trim() || input.length > max) throw new Error("ข้อมูลไม่ถูกต้อง");
  return input.trim();
}

function uuid(input: unknown): string {
  if (typeof input !== "string" || !/^[a-f0-9-]{36}$/i.test(input)) throw new Error("รหัสข้อมูลไม่ถูกต้อง");
  return input;
}

function postgresError(error: unknown): never {
  const code = (error as { code?: string }).code;
  if (code === "42P01") throw new Error("ยังไม่ได้สร้างตาราง Supabase กรุณารัน supabase/migrations/001_initial.sql");
  if (code === "23503") throw new Error("มีประวัติคิวอ้างอิงอยู่ กรุณาปิดใช้งานแทนการลบ");
  if (code === "23505") throw new Error("ข้อมูลซ้ำ กรุณาลองใหม่หรือตรวจชื่อและตัวอักษรนำหน้าคิว");
  if (code === "23514" || code === "22P02") throw new Error("ข้อมูลไม่ถูกต้อง");
  throw error;
}

const QUEUE_COLUMNS = `q.id, q.queue_number, q.queue_sequence, q.service_id,
  q.counter_id, q.status, q.queue_date, q.created_at, q.called_at,
  q.serving_at, q.completed_at, q.customer_name,
  row_to_json(s) as service, row_to_json(c) as counter`;
const QUEUE_FROM = `from public.queues q
  left join public.services s on s.id = q.service_id
  left join public.counters c on c.id = q.counter_id`;
const TODAY = "(now() at time zone 'Asia/Bangkok')::date";

async function queueById(db: Db, id: string): Promise<QueueWithRelations> {
  const [queue] = await rows<QueueWithRelations>(db, `select ${QUEUE_COLUMNS} ${QUEUE_FROM} where q.id = $1`, [id]);
  if (!queue) throw new Error("ไม่พบคิว");
  return queue;
}

async function position(db: Db, queue: Queue): Promise<number> {
  if (queue.status !== "waiting") return 0;
  const [result] = await rows<{ position: number }>(db, `select count(*)::int as position from public.queues
    where service_id = $1 and queue_date = $2 and status = 'waiting' and queue_sequence < $3`,
    [queue.service_id, queue.queue_date, queue.queue_sequence]);
  return result.position;
}

async function getQueueList(db: Db, date: "today" | "upcoming"): Promise<QueueWithRelations[]> {
  const condition = date === "today" ? `q.queue_date = ${TODAY}` : `q.queue_date > ${TODAY}`;
  const order = date === "today" ? "q.created_at, q.id" : "q.queue_date, q.created_at, q.id";
  return rows<QueueWithRelations>(db, `select ${QUEUE_COLUMNS} ${QUEUE_FROM} where ${condition} order by ${order}`);
}

async function createQueue(args: Arguments): Promise<Booking> {
  const serviceId = uuid(args.serviceId);
  const requestId = uuid(args.requestId);
  const customerName = value(args.customerName, 100);
  const bookingDate = value(args.bookingDate, 10);
  const today = todayInBangkok();
  const parsed = new Date(`${bookingDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== bookingDate || bookingDate < today || bookingDate > addDaysToDate(today, 30)) {
    throw new Error("เลือกวันที่ภายใน 30 วันนับจากวันนี้");
  }
  return transaction(async client => {
    // All retries of a request ID serialize before checking for an existing row.
    await client.query("select pg_advisory_xact_lock(8271, hashtext($1))", [requestId]);
    const [existing] = await rows<{ id: string; service_id: string; queue_date: string; customer_name: string }>(client,
      "select id, service_id, queue_date, customer_name from public.queues where request_id = $1", [requestId]);
    if (existing) {
      if (existing.service_id !== serviceId || existing.queue_date !== bookingDate || existing.customer_name !== customerName) {
        throw new Error("Request already used");
      }
      const queue = await queueById(client, existing.id);
      return { queue, position: await position(client, queue) };
    }
    const [service] = await rows<Service>(client, "select * from public.services where id = $1 and is_active = true", [serviceId]);
    if (!service) throw new Error("บริการนี้ไม่เปิดให้รับคิว");
    // Number generation for one service/date is atomic even with many web servers.
    await client.query("select pg_advisory_xact_lock(8272, hashtext($1))", [`${serviceId}:${bookingDate}`]);
    const [sequenceRow] = await rows<{ sequence: number }>(client,
      "select (coalesce(max(queue_sequence), 0) + 1)::int as sequence from public.queues where service_id = $1 and queue_date = $2",
      [serviceId, bookingDate]);
    const id = randomUUID();
    await client.query(`insert into public.queues
      (id, queue_number, queue_sequence, service_id, status, queue_date, request_id, customer_name)
      values ($1, $2, $3, $4, 'waiting', $5, $6, $7)`,
      [id, `${service.prefix}${String(sequenceRow.sequence).padStart(3, "0")}`, sequenceRow.sequence,
        serviceId, bookingDate, requestId, customerName]);
    const queue = await queueById(client, id);
    return { queue, position: await position(client, queue) };
  });
}

async function callNext(args: Arguments): Promise<QueueWithRelations | null> {
  const counterId = uuid(args.counterId);
  const serviceId = args.serviceId ? uuid(args.serviceId) : null;
  return transaction(async client => {
    const [counter] = await rows<Counter>(client,
      "select * from public.counters where id = $1 and is_active = true for update", [counterId]);
    if (!counter) throw new Error("ช่องบริการไม่เปิดใช้งาน");
    const [current] = await rows<{ id: string }>(client,
      `select id from public.queues where counter_id = $1 and queue_date = ${TODAY}
       and status in ('called', 'serving') order by called_at desc limit 1`, [counterId]);
    if (current) return queueById(client, current.id);
    const [next] = await rows<{ id: string }>(client,
      `select id from public.queues where queue_date = ${TODAY} and status = 'waiting'
       and ($1::uuid is null or service_id = $1) order by created_at, id
       for update skip locked limit 1`, [serviceId]);
    if (!next) return null;
    await client.query("update public.queues set status = 'called', counter_id = $2, called_at = now() where id = $1",
      [next.id, counterId]);
    return queueById(client, next.id);
  });
}

async function transition(args: Arguments): Promise<QueueWithRelations> {
  const id = uuid(args.id);
  const operation = args.operation;
  return transaction(async client => {
    const [queue] = await rows<Queue>(client,
      `select * from public.queues where id = $1 and queue_date = ${TODAY} for update`, [id]);
    if (!queue) throw new Error("ไม่พบคิววันนี้");
    const targets: Record<string, string> = { serve: "serving", complete: "completed", skip: "skipped" };
    if (typeof operation === "string" && targets[operation] === queue.status) return queueById(client, id);
    const allowed: Record<string, string[]> = {
      recall: ["called", "serving"], serve: ["called"],
      complete: ["called", "serving"], skip: ["waiting", "called", "serving"],
    };
    if (typeof operation !== "string" || !allowed[operation]?.includes(queue.status)) {
      throw new Error("สถานะคิวไม่รองรับคำสั่งนี้");
    }
    if (operation === "recall") {
      await client.query("update public.queues set called_at = now() where id = $1", [id]);
    } else if (operation === "serve") {
      await client.query("update public.queues set status = 'serving', serving_at = now() where id = $1", [id]);
    } else {
      await client.query("update public.queues set status = $2, completed_at = now() where id = $1", [id, targets[operation]]);
    }
    return queueById(client, id);
  });
}

async function manage(args: Arguments): Promise<boolean> {
  const table = args.table;
  if (table !== "services" && table !== "counters") throw new Error("Invalid table");
  const operation = args.operation;
  const relation = `public.${table}`;
  if (operation === "create") {
    const name = value(args.name, 100);
    if (table === "services") {
      const prefix = value(args.prefix, 2).toUpperCase();
      if (!/^[A-Z]{1,2}$/.test(prefix)) throw new Error("ใช้ตัวอักษร A-Z จำนวน 1–2 ตัว");
      await database().query(`insert into ${relation} (id, name, prefix) values ($1, $2, $3)`, [randomUUID(), name, prefix]);
    } else {
      await database().query(`insert into ${relation} (id, name) values ($1, $2)`, [randomUUID(), name]);
    }
    return true;
  }
  const id = uuid(args.id);
  if (operation === "toggle") {
    if (typeof args.isActive !== "boolean") throw new Error("Invalid active flag");
    const result = await database().query(`update ${relation} set is_active = $2 where id = $1`, [id, args.isActive]);
    if (!result.rowCount) throw new Error("Record not found");
    return true;
  }
  if (operation === "delete") {
    const result = await database().query(`delete from ${relation} where id = $1`, [id]);
    if (!result.rowCount) throw new Error("Record not found");
    return true;
  }
  throw new Error("Invalid operation");
}

async function subscribe(args: Arguments): Promise<boolean> {
  const queueId = uuid(args.queueId);
  const endpoint = value(args.endpoint, 4096);
  const p256dh = value(args.p256dh, 200);
  const auth = value(args.auth, 100);
  await database().query(`insert into public.push_subscriptions (id, queue_id, endpoint, p256dh, auth)
    values ($1, $2, $3, $4, $5)
    on conflict (queue_id, endpoint) do update set p256dh = excluded.p256dh,
    auth = excluded.auth, created_at = now()`, [randomUUID(), queueId, endpoint, p256dh, auth]);
  return true;
}

async function claimNotification(args: Arguments): Promise<string | null> {
  const queueId = uuid(args.queueId);
  if (!["queue_created", "queue_almost_ready", "queue_called"].includes(String(args.type))) {
    throw new Error("Invalid notification type");
  }
  const [row] = await rows<{ id: string }>(database(), `insert into public.notifications
    (id, queue_id, type, state)
    select $1, $2, $3, 'pending'
    where exists (select 1 from public.push_subscriptions where queue_id = $2)
    on conflict (queue_id, type) do update set id = excluded.id, sent_at = now(), state = 'pending'
    where public.notifications.state <> 'sent' and public.notifications.sent_at < now() - interval '2 minutes'
    returning id`, [randomUUID(), queueId, args.type]);
  return row?.id ?? null;
}

async function loginAttempt(args: Arguments): Promise<boolean> {
  const key = value(args.key, 64);
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid key");
  const [row] = await rows<{ attempts: number }>(database(), `insert into public.login_attempts
    (key, attempts) values ($1, 1)
    on conflict (key) do update set
      attempts = case when public.login_attempts.window_started < now() - interval '15 minutes'
        then 1 else public.login_attempts.attempts + 1 end,
      window_started = case when public.login_attempts.window_started < now() - interval '15 minutes'
        then now() else public.login_attempts.window_started end
    returning attempts`, [key]);
  if (row.attempts > 10) throw new Error("Too many attempts. Try again in 15 minutes.");
  return true;
}

async function dispatch(action: string, args: Arguments): Promise<unknown> {
  const db = database();
  if (action === "services" || action === "counters") {
    const table = action === "services" ? "public.services" : "public.counters";
    return rows<Service | Counter>(db, `select * from ${table} ${args.activeOnly ? "where is_active = true" : ""} order by created_at, id`);
  }
  if (action === "today_queues") return getQueueList(db, "today");
  if (action === "upcoming_queues") return getQueueList(db, "upcoming");
  if (action === "monitor_data") {
    const [counters, queues] = await Promise.all([
      rows<Counter>(db, "select * from public.counters where is_active = true order by created_at, id"),
      getQueueList(db, "today"),
    ]);
    return { counters, queues };
  }
  if (action === "customer_queue") {
    const id = uuid(args.id);
    const [row] = await rows<QueueWithRelations & { position: number }>(db,
      `select ${QUEUE_COLUMNS},
        (select count(*)::int from public.queues before_q where before_q.service_id = q.service_id
         and before_q.queue_date = q.queue_date and before_q.status = 'waiting'
         and before_q.queue_sequence < q.queue_sequence) as position
       ${QUEUE_FROM} where q.id = $1`, [id]);
    if (!row) return null;
    const { position: rowPosition, ...queue } = row;
    return { queue, position: queue.status === "waiting" ? rowPosition : 0 };
  }
  if (action === "create_queue") return createQueue(args);
  if (action === "call_next") return callNext(args);
  if (action === "transition") return transition(args);
  if (action === "manage") return manage(args);
  if (action === "subscribe") return subscribe(args);
  if (action === "subscriptions") return rows<PushSubscriptionRow>(db,
    "select * from public.push_subscriptions where queue_id = $1", [uuid(args.queueId)]);
  if (action === "delete_subscription") {
    await db.query("delete from public.push_subscriptions where id = $1", [uuid(args.id)]);
    return true;
  }
  if (action === "almost_ready") return rows<Queue>(db, `select q.id, q.queue_number, q.queue_sequence,
    q.service_id, q.counter_id, q.status, q.queue_date, q.created_at, q.called_at,
    q.serving_at, q.completed_at, q.customer_name from public.queues q
    where q.queue_date = ${TODAY} and q.status = 'waiting'
      and (select count(*) from public.queues before_q where before_q.service_id = q.service_id
        and before_q.queue_date = q.queue_date and before_q.status = 'waiting'
        and before_q.queue_sequence < q.queue_sequence) <= 3`);
  if (action === "claim_notification") return claimNotification(args);
  if (action === "finish_notification") {
    if (args.sent) await db.query("update public.notifications set state = 'sent' where id = $1", [uuid(args.id)]);
    else await db.query("delete from public.notifications where id = $1", [uuid(args.id)]);
    return true;
  }
  if (action === "login_attempt") return loginAttempt(args);
  if (action === "reset_all") {
    await db.query("truncate table public.notifications, public.push_subscriptions, public.queues, public.services, public.counters, public.login_attempts");
    return true;
  }
  throw new Error("Unknown action");
}

export async function dbAction<T>(action: string, args: Arguments = {}): Promise<T> {
  try {
    if (!process.env.DATABASE_URL) return await supabaseAction<T>(action, args);
    return await dispatch(action, args) as T;
  }
  catch (error) { postgresError(error); }
}
