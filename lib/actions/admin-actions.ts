"use server";
import { revalidatePath } from "next/cache";
import { authenticate, requireAdmin } from "@/lib/auth/session";
import { sheets } from "@/lib/sheets/client";
async function manage(table: "services" | "counters", operation: string, args: Record<string, unknown>) {
  await requireAdmin();
  await sheets("manage", { table, operation, ...args });
  revalidatePath(`/admin/${table}`);
  revalidatePath("/admin/services");
  revalidatePath("/admin/call");
  revalidatePath("/");
  revalidatePath("/queue");
}
export async function createService(formData: FormData): Promise<void> {
  await manage("services", "create", { name: String(formData.get("name") ?? "").trim(), prefix: String(formData.get("prefix") ?? "").trim().toUpperCase() });
}
export async function toggleServiceActive(id: string, isActive: boolean): Promise<void> { await manage("services", "toggle", { id, isActive }); }
export async function deleteService(id: string): Promise<void> { await manage("services", "delete", { id }); }
export async function createCounter(formData: FormData): Promise<void> { await manage("counters", "create", { name: String(formData.get("name") ?? "").trim() }); }
export async function toggleCounterActive(id: string, isActive: boolean): Promise<void> { await manage("counters", "toggle", { id, isActive }); }
export async function deleteCounter(id: string): Promise<void> { await manage("counters", "delete", { id }); }

export async function deleteAllData(password: string): Promise<{ error: string | null }> {
  const session = await requireAdmin();
  if (!password || password.length > 1024 || !(await authenticate(session.username, password))) {
    return { error: "รหัสผ่านแอดมินไม่ถูกต้อง" };
  }
  try {
    await sheets("reset_all");
    revalidatePath("/", "layout");
    return { error: null };
  } catch (error) {
    if (error instanceof Error && error.message === "Unknown action") {
      return { error: "Apps Script ยังเป็นเวอร์ชันเก่า กรุณาอัปเดต Code.gs และ Deploy เวอร์ชันใหม่" };
    }
    return { error: "ลบข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Apps Script แล้วลองใหม่" };
  }
}
