import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}

export function signToken(payload: Record<string, unknown>, seconds: number): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + seconds * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function readToken(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = createHmac("sha256", secret()).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    return payload && typeof payload.exp === "number" && payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}
