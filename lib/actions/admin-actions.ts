"use server";
import { revalidatePath } from "next/cache";
import { authenticate, requireAdmin } from "@/lib/auth/session";
import { dbAction } from "@/lib/db/client";
async function manage(table: "services" | "counters", operation: string, args: Record<string, unknown>) {
  await requireAdmin();
  await dbAction("manage", { table, operation, ...args });
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
export async function createCounter(formData: FormData): Promise<void> {
  await requireAdmin();
  await dbAction("counter_create", {
    name: String(formData.get("name") ?? "").trim(),
    serviceIds: formData.getAll("serviceIds").map(String),
  });
  revalidatePath("/admin/services");
  revalidatePath("/admin/call");
}
export async function assignCounterServices(counterId: string, serviceIds: string[]): Promise<void> {
  await requireAdmin();
  await dbAction("counter_assign", { counterId, serviceIds });
  revalidatePath("/admin/services");
  revalidatePath("/admin/call");
}
export async function toggleCounterActive(id: string, isActive: boolean): Promise<void> { await manage("counters", "toggle", { id, isActive }); }
export async function deleteCounter(id: string): Promise<void> { await manage("counters", "delete", { id }); }

export async function deleteAllData(password: string): Promise<{ error: string | null }> {
  const session = await requireAdmin();
  if (!password || password.length > 1024 || !(await authenticate(session.username, password))) {
    return { error: "รหัสผ่านแอดมินไม่ถูกต้อง" };
  }
  try {
    await dbAction("reset_all");
    revalidatePath("/", "layout");
    return { error: null };
  } catch (error) {
    console.error("Failed to reset queue data", error);
    return { error: "ลบข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ Supabase แล้วลองใหม่" };
  }
}
