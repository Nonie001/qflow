import test from "node:test";
import assert from "node:assert/strict";
import { signToken, readToken } from "../lib/auth/tokens.ts";

process.env.SESSION_SECRET = "test-only-secret-".repeat(4);

test("signed tokens reject tampering, wrong secrets, expired and malformed values", () => {
  const token = signToken({ purpose: "queue", id: "owned" }, 60);
  assert.equal(readToken(token).id, "owned");
  const forged = Buffer.from(JSON.stringify({ purpose: "staff", role: "admin", exp: Date.now() + 100000 })).toString("base64url");
  assert.equal(readToken(`${forged}.${token.split(".")[1]}`), null);
  assert.equal(readToken(signToken({ id: "expired" }, -1)), null);
  for (const value of [undefined, "", "a.b.c", "bad.data", "."]) assert.equal(readToken(value), null);
  process.env.SESSION_SECRET = "different-secret-".repeat(4);
  assert.equal(readToken(token), null);
  process.env.SESSION_SECRET = "test-only-secret-".repeat(4);
});

test("missing/weak session secret fails closed", () => {
  process.env.SESSION_SECRET = "short";
  assert.throws(() => signToken({ purpose: "staff" }, 60), /SESSION_SECRET/);
  process.env.SESSION_SECRET = "test-only-secret-".repeat(4);
});
