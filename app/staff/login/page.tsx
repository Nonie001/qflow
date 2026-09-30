import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/staff/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function StaffLoginPage() {
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  return (
    <main className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-[#f5faf6] px-4 py-10 sm:py-14">
      <div aria-hidden className="pointer-events-none absolute -left-28 -top-40 size-[30rem] rounded-full bg-[#dcefe2]/70 blur-3xl" />
      <div className="relative w-full max-w-[480px]">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/queue" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" /> {t("กลับหน้ารับคิว", "Kembali ke tempahan")}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-[#dce9df] bg-white shadow-[0_28px_70px_-42px_rgba(11,72,42,0.35)]">
          <div className="relative overflow-hidden bg-[#104f36] px-7 pb-8 pt-7 text-white sm:px-9">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-28 size-64 rounded-full border-[35px] border-white/5" />
            <Image src="/bina-logo.jpg" width={90} height={87} alt="Bina" className="relative size-20 rounded-xl bg-white object-contain" priority />
            <div className="relative mt-6">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#c8ebd5]"><ShieldCheck className="size-4 text-[#e9be4c]" /> {t("สำหรับผู้ดูแลระบบ", "Untuk pentadbir")}</span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("เข้าสู่ระบบ", "Log masuk")}</h1>
              <p className="mt-2 text-sm leading-6 text-[#d8eee0]">{t("จัดการคิว บริการ และข้อมูลสหกรณ์ในที่เดียว", "Urus giliran, perkhidmatan dan maklumat koperasi di satu tempat")}</p>
            </div>
          </div>

          <div className="px-7 py-8 sm:px-9">
            <p className="mb-6 text-sm text-muted-foreground">{t("กรอกชื่อผู้ใช้และรหัสผ่านของเจ้าหน้าที่", "Masukkan nama pengguna dan kata laluan kakitangan")}</p>
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("สหกรณ์อิสลามบีนา จำกัด · ระบบจัดการคิวสำหรับเจ้าหน้าที่", "Bina Islamic Cooperative · Pengurusan giliran kakitangan")}</p>
      </div>
    </main>
  );
}
