import { cache } from "react";
import { sheets } from "@/lib/sheets/client";
import { requireAdmin } from "@/lib/auth/session";
import type { Service } from "@/lib/types/domain";
export const getActiveServices = cache(async () => sheets<Service[]>("services", { activeOnly: true }));
export async function getAllServices() {
  await requireAdmin();
  return sheets<Service[]>("services");
}
