import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const schema = readFileSync(new URL("../supabase/migrations/001_initial.sql", import.meta.url), "utf8");

test("Supabase schema creates tables and preserves queue uniqueness under concurrent-style inserts", async () => {
  const db = new PGlite();
  try {
    await db.exec(schema);
    const service = randomUUID(), counter = randomUUID();
    await db.query("insert into services (id, name, prefix) values ($1, 'บริการทั่วไป', 'A')", [service]);
    await db.query("insert into counters (id, name) values ($1, 'ช่อง 1')", [counter]);
    const insert = (number, sequence, status, counterId = null) => db.query(
      `insert into queues (id, queue_number, queue_sequence, service_id, counter_id,
       status, queue_date, request_id, customer_name)
       values ($1, $2, $3, $4, $5, $6, '2026-09-30', $7, 'สมชาย')`,
      [randomUUID(), number, sequence, service, counterId, status, randomUUID()],
    );
    await insert("A001", 1, "called", counter);
    await assert.rejects(insert("A001", 1, "waiting"), /unique|duplicate/i);
    await assert.rejects(insert("A002", 2, "serving", counter), /unique|duplicate/i);
    await insert("A002", 2, "waiting");
    await assert.rejects(db.query("delete from services where id = $1", [service]), /foreign key/i);
  } finally {
    await db.close();
  }
});

test("the same counter can serve a new date and notification claims remain unique", async () => {
  const db = new PGlite();
  try {
    await db.exec(schema);
    const service = randomUUID(), counter = randomUUID(), queueId = randomUUID();
    await db.query("insert into services (id, name, prefix) values ($1, 'บริการทั่วไป', 'A')", [service]);
    await db.query("insert into counters (id, name) values ($1, 'ช่อง 1')", [counter]);
    await db.query(`insert into queues (id, queue_number, queue_sequence, service_id, counter_id,
      status, queue_date, request_id) values ($1, 'A001', 1, $2, $3, 'called', '2026-09-30', $4)`,
      [queueId, service, counter, randomUUID()]);
    await db.query(`insert into queues (id, queue_number, queue_sequence, service_id, counter_id,
      status, queue_date, request_id) values ($1, 'A001', 1, $2, $3, 'called', '2026-10-01', $4)`,
      [randomUUID(), service, counter, randomUUID()]);
    await db.query("insert into notifications (id, queue_id, type, state) values ($1, $2, 'queue_called', 'pending')",
      [randomUUID(), queueId]);
    await assert.rejects(db.query(
      "insert into notifications (id, queue_id, type, state) values ($1, $2, 'queue_called', 'pending')",
      [randomUUID(), queueId]), /unique|duplicate/i);
  } finally {
    await db.close();
  }
});
