import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import { signToken, readToken } from "../lib/auth/tokens.ts";

const require = createRequire(import.meta.url);
const jar = new Map();
const options = new Map();
const cookies = async () => ({
  get: key => jar.has(key) ? { value: jar.get(key) } : undefined,
  set: (key, value, config) => { jar.set(key, value); options.set(key, config); },
  delete: key => jar.delete(key),
});
const code = ts.transpileModule(readFileSync(new URL("../lib/auth/session.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = vm.createContext({
  exports: {}, Buffer, process,
  require: id => {
    if (id === "server-only") return {};
    if (id === "next/headers") return { cookies };
    if (id === "next/navigation") return { redirect: path => { throw new Error(`REDIRECT:${path}`); } };
    if (id === "./tokens") return { signToken, readToken };
    return require(id);
  },
});
vm.runInContext(code, context);
const auth = context.exports;
process.env.SESSION_SECRET = "session-test-only-".repeat(4);
const admin = { username: "admin", role: "admin", password: "1234" };
const configure = () => {
  jar.clear();
  process.env.ADMIN_USERNAME = admin.username;
  process.env.ADMIN_PASSWORD = admin.password;
};

test("single admin authentication validates env credentials and invalidates changed sessions", async () => {
  configure();
  assert.equal(await auth.authenticate(admin.username, "wrong"), null);
  assert.equal(await auth.authenticate("unknown", admin.password), null);
  const account = await auth.authenticate(` ${admin.username} `, admin.password);
  assert.equal(account.username, admin.username);
  await auth.setSession(account);
  assert.equal((await auth.requireStaff()).role, "admin");
  assert.equal(options.get("qflow_session").httpOnly, true);
  assert.equal(options.get("qflow_session").sameSite, "lax");
  assert.equal(options.get("qflow_session").maxAge, 28800);
  assert.equal((await auth.requireAdmin()).role, "admin");
  process.env.ADMIN_PASSWORD = "changed-password";
  assert.equal(await auth.getSession(), null);
  await assert.rejects(auth.requireStaff(), /REDIRECT:\/staff\/login/);
  process.env.ADMIN_PASSWORD = "";
  assert.equal(await auth.authenticate(admin.username, admin.password), null);
  await auth.clearSession();
  assert.equal(await auth.getSession(), null);
});

test("customer ownership is restricted to the signed queue and cannot become a staff session", async () => {
  configure();
  const own = randomUUID(), other = randomUUID();
  assert.equal(await auth.canReadQueue(own), false);
  await auth.grantQueueAccess(own);
  assert.equal(await auth.canReadQueue(own), true);
  assert.equal(await auth.getLatestQueueId(), own);
  assert.equal(options.get(`qflow_queue_${own}`).maxAge, 32 * 24 * 60 * 60);
  assert.equal(await auth.canReadQueue(other), false);
  jar.set(`qflow_queue_${other}`, jar.get(`qflow_queue_${own}`));
  assert.equal(await auth.canReadQueue(other), false);
  jar.set("qflow_latest_queue", jar.get(`qflow_queue_${own}`));
  assert.equal(await auth.getLatestQueueId(), null);
  jar.set("qflow_session", jar.get(`qflow_queue_${own}`));
  assert.equal(await auth.getSession(), null);
  await auth.setSession(admin);
  assert.equal(await auth.canReadQueue(other), true);
});
