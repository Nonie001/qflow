import Link from "next/link";
import Image from "next/image";
import { Monitor } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { SignOutButton } from "@/components/staff/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminAutoRefresh } from "@/components/admin/admin-auto-refresh";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  const nav = [
    { href: "/admin", label: t("แดชบอร์ด", "Papan pemuka") },
    { href: "/admin/call", label: t("เรียกคิว", "Panggil giliran") },
    { href: "/admin/services", label: t("บริการ", "Perkhidmatan") },
    { href: "/admin/queues", label: t("คิวทั้งหมด", "Semua giliran") },
  ];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <AdminAutoRefresh />
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <Image src="/bina-logo.jpg" width={50} height={49} alt="" className="size-11 rounded-lg object-contain" />
            <span className="min-w-0">
              <span className="block text-base font-bold leading-tight">Bina Queue</span>
              <span className="block truncate text-[11px] text-muted-foreground">{t("ระบบจัดการคิวสหกรณ์", "Pengurusan giliran koperasi")}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/display"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              className={buttonVariants({ variant: "outline", size: "sm", className: "px-2.5 sm:px-3" })}
            >
              <Monitor className="size-4" />
              <span className="hidden sm:inline">{t("จอแสดงคิว", "Paparan giliran")}</span>
            </Link>
            <LanguageSwitcher compact />
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6"><AdminNav items={nav} /></div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
