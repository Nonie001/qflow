import { dbAction } from "@/lib/db/client";
import { requireStaff } from "@/lib/auth/session";
import type { Counter } from "@/lib/types/domain";
export async function getAllCounters() {
  await requireStaff();
  return dbAction<Counter[]>("counters");
}
