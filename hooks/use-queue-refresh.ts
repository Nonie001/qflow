"use client";
import { useEffect, useRef } from "react";
/** Refresh visible pages and refresh immediately when a tab becomes active. */
export function useQueueRefresh(onChange: () => void, intervalMs = 2_000) {
  const callback = useRef(onChange);
  const lastRefreshAt = useRef(0);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshAt.current < 1_000) return;
      lastRefreshAt.current = now;
      callback.current();
    };
    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [intervalMs]);
}
