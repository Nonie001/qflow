"use server";
import { redirect } from "next/navigation";
import { authenticate, setSession, clearSession } from "@/lib/auth/session";
import { dbAction } from "@/lib/db/client";
import { createHash } from "node:crypto";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
export interface AuthActionState { error: string | null }
export async function signIn(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (username.length > 100 || password.length > 1024) return { error: t("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "Nama pengguna atau kata laluan tidak betul") };
  try {
    const key = createHash("sha256").update(username).digest("hex");
    await dbAction("login_attempt", { key });
    const account = await authenticate(username, password);
    if (!account) return { error: t("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "Nama pengguna atau kata laluan tidak betul") };
    await setSession(account);
  } catch {
    return { error: t("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจข้อมูลหรือลองใหม่ภายหลัง", "Log masuk gagal. Semak maklumat atau cuba lagi kemudian") };
  }
  redirect("/admin");
}
export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/staff/login");
}
