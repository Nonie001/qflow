import { cache } from "react";
import { sheets } from "@/lib/sheets/client";
import { requireStaff } from "@/lib/auth/session";
import type { Counter } from "@/lib/types/domain";
export const getActiveCounters = cache(async () => sheets<Counter[]>("counters", { activeOnly: true }));
export async function getAllCounters() {
  await requireStaff();
  return sheets<Counter[]>("counters");
}
