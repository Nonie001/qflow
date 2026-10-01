"use server";
import { requireStaff } from "@/lib/auth/session";
import { dbAction } from "@/lib/db/client";
import type { QueueWithRelations } from "@/lib/types/domain";
export async function callNextQueue(counterId: string) {
  await requireStaff();
  return dbAction<QueueWithRelations | null>("call_next", { counterId });
}
async function transition(id: string, operation: string) {
  await requireStaff();
  return dbAction<QueueWithRelations>("transition", { id, operation });
}
export async function recallCurrentQueue(id: string) { return transition(id, "recall"); }
export async function startServingQueue(id: string) { return transition(id, "serve"); }
export async function completeQueue(id: string) { return transition(id, "complete"); }
export async function skipQueue(id: string) { return transition(id, "skip"); }
