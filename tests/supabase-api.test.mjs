import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const schema = readFileSync(new URL("../supabase/migrations/001_initial.sql", import.meta.url), "utf8");
const api = readFileSync(new URL("../supabase/migrations/002_api.sql", import.meta.url), "utf8");

test("Supabase RPC books, reads, calls, and completes a queue without exposing request ID", async () => {
  const db = new PGlite();
  try {
    await db.exec(schema);
    await db.exec(api);
    const service = randomUUID();
    const counter = randomUUID();
    const requestId = randomUUID();
    const { rows: dateRows } = await db.query("select (now() at time zone 'Asia/Bangkok')::date::text as today");
    const bookingDate = dateRows[0].today;
    await db.query("insert into services (id, name, prefix) values ($1, 'บริการทั่วไป', 'A')", [service]);
    await db.query("insert into counters (id, name) values ($1, 'ช่อง 1')", [counter]);
    const action = async (name, args = {}) => {
      const { rows } = await db.query("select public.qflow_action($1, $2::jsonb) as result", [name, JSON.stringify(args)]);
      return rows[0].result;
    };
    const booking = await action("create_queue", {
      serviceId: service, requestId, customerName: "สมชาย", bookingDate,
    });
    assert.equal(booking.queue.queue_number, "A001");
    assert.equal(booking.queue.customer_name, "สมชาย");
    assert.equal(booking.queue.request_id, undefined);
    assert.equal(booking.position, 0);
    const retry = await action("create_queue", {
      serviceId: service, requestId, customerName: "สมชาย", bookingDate,
    });
    assert.equal(retry.queue.id, booking.queue.id);
    const second = await action("create_queue", {
      serviceId: service, requestId: randomUUID(), customerName: "อาลี", bookingDate,
    });
    assert.equal(second.queue.queue_number, "A002");
    assert.equal(second.position, 1);
    const called = await action("call_next", { counterId: counter, serviceId: service });
    assert.equal(called.queue_number, "A001");
    assert.equal(called.status, "called");
    assert.equal((await action("monitor_data")).queues.length, 2);
    assert.equal((await action("customer_queue", { id: second.queue.id })).position, 0);
    assert.equal((await action("transition", { id: called.id, operation: "complete" })).status, "completed");
    assert.equal((await action("call_next", { counterId: counter, serviceId: service })).queue_number, "A002");
  } finally {
    await db.close();
  }
});
