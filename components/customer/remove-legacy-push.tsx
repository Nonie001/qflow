"use client";

import { useEffect } from "react";

export function RemoveLegacyPush() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      for (const registration of registrations) {
        const script = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
        if (!script || new URL(script).pathname !== "/sw.js") continue;
        const subscription = await registration.pushManager.getSubscription();
        await subscription?.unsubscribe();
        await registration.unregister();
      }
    }).catch(() => {});
  }, []);

  return null;
}
