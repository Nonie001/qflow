import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const migration = (name) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");

test("counter assignments control which waiting queue can be called", async () => {
  const db = new PGlite();
  try {
    await db.exec(migration("001_initial.sql"));
    await db.exec(migration("002_api.sql"));
    const serviceA = randomUUID();
    const serviceB = randomUUID();
    const oldCounter = randomUUID();
    await db.query("insert into services (id, name, prefix) values ($1, 'A service', 'A'), ($2, 'B service', 'B')", [serviceA, serviceB]);
    await db.query("insert into counters (id, name) values ($1, 'Existing counter')", [oldCounter]);
    await db.exec(migration("003_counter_services.sql"));

    const action = async (name, args = {}) => {
      const { rows } = await db.query("select public.qflow_counter_action($1, $2::jsonb) as result", [name, JSON.stringify(args)]);
      return rows[0].result;
    };
    const { rows: before } = await db.query("select service_ids from counters where id = $1", [oldCounter]);
    assert.deepEqual(new Set(before[0].service_ids), new Set([serviceA, serviceB]));

    await action("assign", { counterId: oldCounter, serviceIds: [serviceA] });
    await db.exec(migration("003_counter_services.sql"));
    const { rows: after } = await db.query("select service_ids from counters where id = $1", [oldCounter]);
    assert.deepEqual(after[0].service_ids, [serviceA]);
    await assert.rejects(action("assign", { counterId: oldCounter, serviceIds: [] }), /กรุณาเลือกบริการ/);

    const { rows: dateRows } = await db.query("select (now() at time zone 'Asia/Bangkok')::date::text as today");
    const date = dateRows[0].today;
    const booking = async (serviceId) => {
      const { rows } = await db.query("select public.qflow_action('create_queue', $1::jsonb) as result", [
        JSON.stringify({ serviceId, requestId: randomUUID(), customerName: "Test", bookingDate: date }),
      ]);
      return rows[0].result.queue;
    };
    const queueB = await booking(serviceB);
    const queueA = await booking(serviceA);
    const usage = await action("usage");
    assert.deepEqual(new Set(usage.serviceIds), new Set([serviceA, serviceB]));
    assert.deepEqual(usage.counterIds, []);
    assert.equal((await action("call_next", { counterId: oldCounter })).id, queueA.id);
    assert.deepEqual((await action("usage")).counterIds, [oldCounter]);
    await db.query("select public.qflow_action('transition', $1::jsonb)", [JSON.stringify({ id: queueA.id, operation: "complete" })]);
    assert.equal(await action("call_next", { counterId: oldCounter }), null);

    await action("create", { name: "New counter", serviceIds: [serviceB] });
    const { rows: newRows } = await db.query("select id from counters where name = 'New counter'");
    assert.equal((await action("call_next", { counterId: newRows[0].id })).id, queueB.id);
  } finally {
    await db.close();
  }
});
