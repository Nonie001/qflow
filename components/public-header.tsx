import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n-server";

export async function PublicHeader() {
  const locale = await getLocale();
  return (
    <header className="border-b border-border/80 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/queue" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <Image src="/bina-logo.jpg" width={52} height={50} alt="" className="size-12 rounded-lg object-contain" />
          <span className="min-w-0">
            <span className="block text-base font-bold leading-tight tracking-tight text-foreground">Bina Queue</span>
            <span className="block truncate text-[11px] text-muted-foreground">{locale === "ms" ? "Bina Islamic Cooperative" : "สหกรณ์อิสลามบีนา จำกัด"}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/about" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary sm:text-sm">
            {locale === "ms" ? "Tentang kami" : "เกี่ยวกับสหกรณ์"} <ArrowUpRight className="hidden size-3.5 sm:block" aria-hidden />
          </Link>
          <LanguageSwitcher compact />
        </div>
      </div>
    </header>
  );
}
