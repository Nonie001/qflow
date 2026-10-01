"use client";

import { usePathname, useRouter } from "next/navigation";
import { useQueueRefresh } from "@/hooks/use-queue-refresh";

export function AdminAutoRefresh() {
  const pathname = usePathname();
  const router = useRouter();

  // The call page already refreshes every two seconds in StaffWorkspace.
  useQueueRefresh(() => {
    if (pathname !== "/admin/call") router.refresh();
  }, 5_000);

  return null;
}
