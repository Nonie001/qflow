"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function RealtimeRefresh({ supabaseUrl }: { supabaseUrl: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!supabaseUrl || !publishableKey) return;

    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (document.visibilityState !== "visible" || timer) return;
      timer = setTimeout(() => {
        timer = null;
        router.refresh();
      }, 150);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const channel = supabase
      .channel("qflow:changes", { config: { private: false } })
      .on("broadcast", { event: "changed" }, refresh)
      .subscribe((status) => {
        // Catch changes made while the tab was disconnected.
        if (status === "SUBSCRIBED") refresh();
      });

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router, supabaseUrl]);

  return null;
}
