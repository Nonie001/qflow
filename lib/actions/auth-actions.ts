"use server";
import { redirect } from "next/navigation";
import { authenticate, setSession, clearSession } from "@/lib/auth/session";
import { sheets } from "@/lib/sheets/client";
import { createHash } from "node:crypto";
export interface AuthActionState { error: string | null }
export async function signIn(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (username.length > 100 || password.length > 1024) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  try {
    const key = createHash("sha256").update(username).digest("hex");
    await sheets("login_attempt", { key });
    const account = await authenticate(username, password);
    if (!account) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    await setSession(account);
  } catch {
    return { error: "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจข้อมูลหรือลองใหม่ภายหลัง" };
  }
  redirect("/admin");
}
export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/staff/login");
}
