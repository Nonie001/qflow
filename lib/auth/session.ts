import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readToken, signToken } from "./tokens";

const SESSION_COOKIE = "qflow_session";
const SESSION_SECONDS = 60 * 60 * 8;
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
type Account = { username: string; role: "admin"; password: string };

function adminAccount(): Account | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || username.length > 100 || password.length > 1024) return null;
  return { username, role: "admin", password };
}
function revision(account: Account) {
  return createHash("sha256").update(`${account.username}:${account.role}:${account.password}`).digest("hex");
}
function sameValue(actual: string, expected: string) {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}
export async function authenticate(username: string, password: string) {
  if (username.length > 100 || password.length > 1024) return null;
  const account = adminAccount();
  if (!account || !sameValue(username.trim(), account.username) || !sameValue(password, account.password)) return null;
  return account;
}
export async function setSession(account: Account) {
  const value = signToken({ purpose: "staff", username: account.username, revision: revision(account) }, SESSION_SECONDS);
  (await cookies()).set(SESSION_COOKIE, value, { ...cookieOptions, maxAge: SESSION_SECONDS });
}
export async function getSession() {
  const payload = readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (payload?.purpose !== "staff") return null;
  const account = adminAccount();
  if (!account || payload.username !== account.username || payload.revision !== revision(account)) return null;
  return { username: account.username, role: account.role };
}
export async function clearSession() { (await cookies()).delete(SESSION_COOKIE); }
export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/staff/login");
  return session;
}
export async function requireAdmin() {
  const session = await requireStaff();
  if (session.role !== "admin") redirect("/staff");
  return session;
}
export async function grantQueueAccess(id: string) {
  const seconds = 60 * 60 * 48;
  (await cookies()).set(`qflow_queue_${id}`, signToken({ purpose: "queue", id }, seconds), { ...cookieOptions, maxAge: seconds });
}
export async function canReadQueue(id: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return false;
  const payload = readToken((await cookies()).get(`qflow_queue_${id}`)?.value);
  return (payload?.purpose === "queue" && payload.id === id) || !!(await getSession());
}
