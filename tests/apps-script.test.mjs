import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

function backend() {
  const tabs = new Map(), cache = new Map();
  let locked = false;
  const stats = { locks: 0, flushes: 0 };
  class Sheet {
    data = [];
    getLastRow() { return this.data.length; }
    setFrozenRows() {}
    getDataRange() { return { getValues: () => structuredClone(this.data) }; }
    getRange(row, column, height, width) {
      const range = {
        setNumberFormat: () => range,
        setValues: values => {
          assert.equal(locked, true, "all writes require the script lock");
          assert.equal(values.length, height);
          values.forEach((valuesRow, i) => {
            assert.equal(valuesRow.length, width);
            this.data[row - 1 + i] ??= [];
            valuesRow.forEach((value, j) => { this.data[row - 1 + i][column - 1 + j] = value; });
          });
        },
      };
      return range;
    }
    deleteRow(row) { assert.equal(locked, true); this.data.splice(row - 1, 1); }
    deleteRows(row, count) { assert.equal(locked, true); this.data.splice(row - 1, count); }
  }
  const properties = { API_SECRET: "s".repeat(64), SPREADSHEET_ID: "test-sheet" };
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] }) },
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: name => tabs.get(name), insertSheet: name => { const sheet = new Sheet(); tabs.set(name, sheet); return sheet; } }),
      flush: () => { stats.flushes++; },
    },
    LockService: { getScriptLock: () => ({ waitLock: () => { assert.equal(locked, false); locked = true; stats.locks++; }, releaseLock: () => { locked = false; } }) },
    Utilities: { getUuid: randomUUID, formatDate: () => "2026-09-18" },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: text => ({ setMimeType: () => text }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
  });
  vm.runInContext(readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8"), context);
  context.setup();
  function request(action, args = {}, key = properties.API_SECRET) {
    return JSON.parse(context.doPost({ postData: { contents: JSON.stringify({ key, action, args }) } }));
  }
  function call(action, args = {}) {
    const result = request(action, args);
    if (!result.ok) throw new Error(result.error);
    assert.equal(locked, false, "lock released after response");
    return result.data;
  }
  const services = call("services"), counters = call("counters");
  return { call, request, services, counters, context, tabs, stats };
}

test("setup preserves existing data and endpoint rejects missing/wrong secrets", () => {
  const b = backend();
  const ids = b.services.map(s => s.id);
  b.context.setup();
  assert.deepEqual(b.call("services").map(s => s.id), ids);
  assert.equal(b.request("today_queues", {}, "bad").ok, false);
  assert.equal(b.request("manage", {}, "").ok, false);
  assert.equal(b.request("unknown").ok, false);
  assert.equal(b.call("counters").length, 3); // error path released lock
  const monitor = b.call("monitor_data");
  assert.equal(monitor.counters.length, 3);
  assert.deepEqual(monitor.queues, []);
});

test("queue sequence per service, request deduplication, private nonce removed", () => {
  const b = backend(), requestId = randomUUID();
  const one = b.call("create_queue", { serviceId: b.services[0].id, requestId, customerName: "สมชาย ใจดี" });
  const retry = b.call("create_queue", { serviceId: b.services[0].id, requestId, customerName: "สมชาย ใจดี" });
  assert.equal(retry.queue.id, one.queue.id);
  assert.equal(one.queue.queue_number, "A001");
  assert.equal(one.queue.customer_name, "สมชาย ใจดี");
  assert.equal("request_id" in one.queue, false);
  assert.equal("request_id" in b.call("today_queues")[0], false);
  const two = b.call("create_queue", { serviceId: b.services[0].id, requestId: randomUUID(), customerName: "มานี" });
  const other = b.call("create_queue", { serviceId: b.services[1].id, requestId: randomUUID(), customerName: "มานะ" });
  assert.equal(two.queue.queue_number, "A002");
  assert.equal(two.position, 1);
  assert.equal(other.queue.queue_number, "B001");
  assert.equal(other.position, 0);
  assert.throws(() => b.call("create_queue", { serviceId: b.services[1].id, requestId, customerName: "สมชาย ใจดี" }), /already used/);
  assert.throws(() => b.call("create_queue", { serviceId: b.services[1].id, requestId: randomUUID(), customerName: "  " }), /Invalid input/);
});

test("counter cannot claim two active queues and different counters cannot claim the same queue", () => {
  const b = backend();
  const first = b.call("create_queue", { serviceId: b.services[0].id, requestId: randomUUID(), customerName: "หนึ่ง" }).queue;
  const second = b.call("create_queue", { serviceId: b.services[1].id, requestId: randomUUID(), customerName: "สอง" }).queue;
  const args = { counterId: b.counters[0].id };
  assert.equal(b.call("call_next", args).id, first.id);
  assert.equal(b.call("call_next", args).id, first.id);
  assert.equal(b.call("call_next", { counterId: b.counters[1].id }).id, second.id);
  assert.equal(b.call("call_next", { counterId: b.counters[2].id }), null);
});

test("transitions reject invalid state and support retry of completed operations", () => {
  const b = backend(), id = b.call("create_queue", { serviceId: b.services[0].id, requestId: randomUUID(), customerName: "ทดสอบ" }).queue.id;
  assert.throws(() => b.call("transition", { id, operation: "complete" }), /สถานะ/);
  b.call("call_next", { counterId: b.counters[0].id });
  const serving = b.call("transition", { id, operation: "serve" });
  assert.equal(serving.status, "serving");
  assert.equal(b.call("transition", { id, operation: "serve" }).serving_at, serving.serving_at);
  assert.equal(b.call("transition", { id, operation: "recall" }).status, "serving");
  const done = b.call("transition", { id, operation: "complete" });
  assert.equal(done.status, "completed");
  assert.equal(b.call("transition", { id, operation: "complete" }).completed_at, done.completed_at);
  assert.throws(() => b.call("transition", { id, operation: "recall" }), /สถานะ/);
});

test("inactive services/counters rejected; historical references prevent deletion", () => {
  const b = backend(), serviceId = b.services[0].id;
  b.call("create_queue", { serviceId, requestId: randomUUID(), customerName: "ทดสอบ" });
  assert.throws(() => b.call("manage", { table: "services", operation: "delete", id: serviceId }), /ประวัติ/);
  b.call("manage", { table: "services", operation: "toggle", id: serviceId, isActive: false });
  assert.throws(() => b.call("create_queue", { serviceId, requestId: randomUUID(), customerName: "ทดสอบ" }), /ไม่เปิด/);
  assert.equal(b.call("services", { activeOnly: true }).length, 2);
  b.call("manage", { table: "counters", operation: "toggle", id: b.counters[0].id, isActive: false });
  assert.throws(() => b.call("call_next", { counterId: b.counters[0].id }), /ไม่เปิด/);
});

test("push endpoint supports multiple tickets; notification claims dedupe and release failures", () => {
  const b = backend();
  const ids = [0, 1].map((index) => b.call("create_queue", { serviceId: b.services[0].id, requestId: randomUUID(), customerName: `ลูกค้า ${index + 1}` }).queue.id);
  const args = { queueId: ids[0], type: "queue_called" };
  assert.equal(b.call("claim_notification", args), null);
  ids.forEach(queueId => b.call("subscribe", { queueId, endpoint: "https://fcm.googleapis.com/test", p256dh: "key", auth: "auth" }));
  b.call("subscribe", { queueId: ids[0], endpoint: "https://fcm.googleapis.com/test", p256dh: "key", auth: "auth" });
  assert.equal(b.call("subscriptions", { queueId: ids[0] }).length, 1);
  assert.equal(b.call("subscriptions", { queueId: ids[1] }).length, 1);
  const claim = b.call("claim_notification", args);
  assert.ok(claim);
  assert.equal(b.call("claim_notification", args), null);
  b.call("finish_notification", { id: claim, sent: false });
  const retry = b.call("claim_notification", args);
  assert.ok(retry);
  b.call("finish_notification", { id: retry, sent: true });
  assert.equal(b.call("claim_notification", args), null);
});

test("login attempts are throttled and formula input is escaped", () => {
  const b = backend(), key = "a".repeat(64);
  for (let i = 0; i < 10; i++) b.call("login_attempt", { key });
  assert.throws(() => b.call("login_attempt", { key }), /Too many/);
  b.call("manage", { table: "counters", operation: "create", name: '=IMPORTXML("https://example.test","a")' });
  const row = b.tabs.get("counters").data.at(-1);
  assert.ok(row[1].startsWith("'="));
});

test("reset all removes every data row and preserves table headers", () => {
  const b = backend();
  b.call("create_queue", { serviceId: b.services[0].id, requestId: randomUUID(), customerName: "ลบทดสอบ" });
  b.call("subscribe", { queueId: b.call("today_queues")[0].id, endpoint: "https://fcm.googleapis.com/test", p256dh: "key", auth: "auth" });
  b.call("reset_all");
  for (const [name, sheet] of b.tabs) {
    assert.equal(sheet.data.length, 1, `${name} should keep only its header row`);
  }
  assert.deepEqual(b.call("services"), []);
  assert.deepEqual(b.call("counters"), []);
  assert.deepEqual(b.call("today_queues"), []);
});
