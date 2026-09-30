"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock3 } from "lucide-react";
import { useQueueRefresh } from "@/hooks/use-queue-refresh";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Counter, QueueWithRelations } from "@/lib/types/domain";
import { localizeName } from "@/lib/i18n";

interface Props {
  recentCalls: QueueWithRelations[];
  counters: Counter[];
}

export function DisplayBoard({ recentCalls, counters }: Props) {
  const router = useRouter();
  const { t, locale } = useLanguage();

  useQueueRefresh(() => router.refresh());

  const currentByCounter = counters
    .map((counter) => ({
      counter,
      queue: recentCalls.find(
        (q) => q.counter_id === counter.id && (q.status === "called" || q.status === "serving"),
      ),
    }))
    .filter((entry) => entry.queue);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f4faf5] text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-4 py-2.5 sm:px-8 sm:py-3">
        <div className="flex items-center gap-3">
          <Image src="/bina-logo.jpg" width={54} height={52} alt="" className="size-10 rounded-lg object-contain sm:size-12" />
          <div>
            <p className="text-base font-bold leading-tight sm:text-lg">Bina Queue</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">{t("สหกรณ์อิสลามบีนา จำกัด", "Bina Islamic Cooperative")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex sm:px-4 sm:text-sm">
            <span className="size-2 animate-pulse rounded-full bg-primary" /> {t("กำลังเรียกคิว", "Giliran sedang dipanggil")}
          </div>
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-8 sm:py-5">
      <div className="mb-4 shrink-0 sm:mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Queue display</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl xl:text-4xl">{t("คิวที่กำลังให้บริการ", "Giliran sedang dilayan")}</h1>
      </div>

      {currentByCounter.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary/25 bg-white/70 text-muted-foreground">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary"><Clock3 className="size-8" /></div>
          <p className="text-xl font-medium">{t("กำลังรอการเรียกคิว", "Menunggu giliran dipanggil")}</p>
        </div>
      ) : (
        <div className={`grid min-h-0 flex-1 auto-rows-fr items-center gap-3 sm:gap-4 ${currentByCounter.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 xl:grid-cols-3"}`}>
          {currentByCounter.map(({ counter, queue }) => (
            <div
              key={counter.id}
              className="flex h-[min(40dvh,420px)] max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#104f36] bg-[#104f36] text-white shadow-[0_22px_60px_-36px_rgba(10,63,39,0.72)] sm:rounded-3xl"
            >
              <div className="shrink-0 truncate border-b border-white/15 px-3 py-2 text-center text-sm font-medium text-[#c2e9d0] sm:text-base">{queue!.service?.name ? localizeName(queue!.service.name, locale) : t("บริการ", "Perkhidmatan")}</div>
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-2 text-center sm:px-4">
                <p className={`${currentByCounter.length > 3 ? "text-[clamp(2.25rem,7vh,5rem)]" : "text-[clamp(3rem,11vh,7rem)]"} font-bold leading-none tracking-tight text-white tabular-nums`}>{queue!.queue_number}</p>
                <p className="mt-[min(2vh,1rem)] line-clamp-2 max-w-full break-words text-[clamp(0.875rem,2.5vh,1.5rem)] font-semibold leading-snug text-[#e4f5e9]" title={queue!.customer_name || undefined}>
                  {queue!.customer_name || t("ไม่ระบุชื่อ", "Tiada nama")}
                </p>
                <div className="mt-[min(2vh,1rem)] h-1 w-10 shrink-0 rounded-full bg-[#e9be4c]" aria-hidden />
                <p className="mt-[min(1.5vh,0.75rem)] text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold text-white">{localizeName(counter.name, locale)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentCalls.length > 0 && <div className="mt-4 shrink-0 border-t border-border pt-3 sm:mt-5">
        <h2 className="mb-2 text-xs font-semibold text-muted-foreground sm:text-sm">{t("เรียกล่าสุด", "Panggilan terkini")}</h2>
        <div className="flex min-w-0 gap-2 overflow-hidden sm:gap-3">
          {recentCalls.slice(0, 5).map((q) => (
            <div
              key={q.id}
              className="min-w-0 flex-1 truncate rounded-xl border border-border bg-white px-3 py-2 text-base font-bold text-primary tabular-nums sm:px-4 sm:text-lg"
            >
              {q.queue_number}
              <span className="ml-2 text-xs font-normal text-muted-foreground sm:text-sm">
                {q.customer_name || t("ไม่ระบุชื่อ", "Tiada nama")} · {q.service?.name ? localizeName(q.service.name, locale) : t("บริการ", "Perkhidmatan")} · {localizeName(q.counter?.name, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>}
      </main>
    </div>
  );
}
