import { cache } from "react";
import { dbAction } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import type { Service } from "@/lib/types/domain";

let activeServices: Service[] | null = null;
let activeServicesExpiresAt = 0;
let activeServicesRequest: Promise<Service[]> | null = null;
let activeServicesRevision = 0;

// Share repeated catalog reads for a short time. The database still validates
// that a service is active when a booking is submitted.
export const getActiveServices = cache(async () => {
  if (activeServices && Date.now() < activeServicesExpiresAt) return activeServices;
  if (!activeServicesRequest) {
    const revision = activeServicesRevision;
    const request = dbAction<Service[]>("services", { activeOnly: true })
      .then((services) => {
        if (revision === activeServicesRevision) {
          activeServices = services;
          activeServicesExpiresAt = Date.now() + 30_000;
        }
        return services;
      })
      .finally(() => { if (activeServicesRequest === request) activeServicesRequest = null; });
    activeServicesRequest = request;
  }
  return activeServicesRequest;
});

export function invalidateActiveServices() {
  activeServicesRevision++;
  activeServices = null;
  activeServicesExpiresAt = 0;
  activeServicesRequest = null;
}

export async function getAllServices() {
  await requireAdmin();
  return dbAction<Service[]>("services");
}
