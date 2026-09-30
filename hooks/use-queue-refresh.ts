"use client";
import { useEffect, useRef } from "react";
/** Poll only while visible; server data stays authoritative. */
export function useQueueRefresh(onChange: () => void) {
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") callback.current(); };
    const timer = window.setInterval(refresh, 2_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);
}
