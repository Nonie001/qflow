import { cache } from "react";
import { dbAction } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import type { Service } from "@/lib/types/domain";

// React cache deduplicates reads within one server render. The next refresh
// reads Supabase again, including changes made from another browser or server.
export const getActiveServices = cache(async (): Promise<Service[]> =>
  dbAction<Service[]>("services", { activeOnly: true }));

export async function getAllServices() {
  await requireAdmin();
  return dbAction<Service[]>("services");
}
