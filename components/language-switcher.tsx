"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div role="group" aria-label={t("เลือกภาษา", "Pilih bahasa")} className="inline-flex shrink-0 items-center rounded-full border border-border bg-white p-0.5 text-xs font-semibold shadow-sm">
      <button type="button" lang="th" aria-pressed={locale === "th"} onClick={() => setLocale("th")}
        className={`rounded-full px-2.5 py-1.5 transition-colors ${locale === "th" ? "bg-primary text-white" : "text-muted-foreground hover:text-primary"}`}>ไทย</button>
      <button type="button" lang="ms" aria-pressed={locale === "ms"} onClick={() => setLocale("ms")}
        className={`rounded-full px-2.5 py-1.5 transition-colors ${locale === "ms" ? "bg-primary text-white" : "text-muted-foreground hover:text-primary"}`}>{compact ? "BM" : "Melayu"}</button>
    </div>
  );
}
