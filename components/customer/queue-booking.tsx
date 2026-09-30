import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ServicePicker } from "@/components/customer/service-picker";
import { getActiveServices } from "@/lib/queries/services";
import { databaseConfigured } from "@/lib/db/client";
import { addDaysToDate, todayInBangkok } from "@/lib/utils/date";
import { getLatestQueueId } from "@/lib/auth/session";
import { PublicHeader } from "@/components/public-header";
import { ArrowRight, CalendarDays, ShieldCheck } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

async function BookingForm({ today, lastBookingDate }: { today: string; lastBookingDate: string }) {
  const services = await getActiveServices();
  return <ServicePicker services={services} today={today} lastBookingDate={lastBookingDate} />;
}

function BookingFormLoading({ locale }: { locale: "th" | "ms" }) {
  const t = (th: string, ms: string) => translate(locale, th, ms);
  return (
    <div className="space-y-5" role="status" aria-label={t("กำลังโหลดรายการบริการ", "Memuatkan perkhidmatan")}>
      <p className="text-sm text-muted-foreground">{t("กำลังโหลดรายการบริการ…", "Memuatkan perkhidmatan…")}</p>
      <div className="h-12 animate-pulse rounded-xl bg-accent/60" />
      <div className="h-12 animate-pulse rounded-xl bg-accent/60" />
      <div className="h-12 animate-pulse rounded-xl bg-accent/60" />
    </div>
  );
}

export async function QueueBooking() {
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  const today = todayInBangkok();
  const lastBookingDate = addDaysToDate(today, 30);
  const latestQueueId = await getLatestQueueId();
  if (!databaseConfigured()) {
    return (
      <>
        <PublicHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm sm:p-12">
            <Image src="/bina-logo.jpg" width={150} height={145} alt="Bina" className="mx-auto h-auto w-36" />
            <h1 className="mt-5 text-2xl font-bold tracking-tight">{t("ระบบรับคิวอยู่ระหว่างเตรียมเปิดให้บริการ", "Sistem tempahan giliran sedang disediakan")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("กรุณากลับมาอีกครั้งภายหลัง", "Sila kembali kemudian")}</p>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-7 sm:px-6 sm:pt-10">
        <section className="relative isolate grid items-center gap-8 overflow-hidden rounded-[2rem] bg-[#104f36] px-6 py-9 text-white shadow-[0_28px_65px_-45px_rgba(10,63,39,0.8)] sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto]">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-44 -z-10 size-96 rounded-full border-[48px] border-white/5" />
          <div aria-hidden className="pointer-events-none absolute -bottom-52 right-24 -z-10 size-96 rounded-full bg-[#25845a]/55 blur-3xl" />
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#e8f7ec]">
              <span className="size-1.5 rounded-full bg-[#f0c85b]" /> {t("บริการจองคิวออนไลน์", "Tempahan giliran dalam talian")}
            </div>
            <div className="mb-4 h-1 w-11 rounded-full bg-[#e9be4c]" aria-hidden />
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.8rem]">{t("จองคิวล่วงหน้า", "Tempah giliran lebih awal")}<br /><span className="text-[#d6f2dd]">{t("ง่ายในไม่กี่ขั้นตอน", "Mudah dalam beberapa langkah")}</span></h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#d7eadf] sm:text-base">
              {t("เลือกวันที่และบริการที่ต้องการ แล้วรับหมายเลขคิวทันที ติดตามสถานะได้จากโทรศัพท์ของคุณ", "Pilih tarikh dan perkhidmatan, dapatkan nombor giliran serta-merta dan semak status melalui telefon anda")}
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#e0f0e5] sm:text-sm">
              <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-[#f0c85b]" /> {t("จองล่วงหน้าได้ 30 วัน", "Tempah hingga 30 hari awal")}</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#f0c85b]" /> {t("ติดตามคิวได้ตลอด", "Semak giliran bila-bila masa")}</span>
            </div>
          </div>
          <div className="mx-auto hidden rounded-[1.75rem] border border-white/20 bg-white p-3 shadow-2xl shadow-black/15 lg:block">
            <Image src="/bina-logo.jpg" width={230} height={223} alt="Bina" className="h-auto w-48 rounded-xl" priority />
          </div>
        </section>

        <div className="mx-auto mt-7 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-start">
          <section className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_22px_55px_-42px_rgba(16,75,44,0.4)] sm:p-8" aria-labelledby="booking-title">
            <div className="mb-7 border-b border-border pb-6">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><span className="size-2 rounded-full bg-[#e9be4c]" /> {t("เริ่มต้นที่นี่", "Mula di sini")}</p>
              <h2 id="booking-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">{t("จองคิวเข้ารับบริการ", "Tempah giliran perkhidmatan")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("กรอกข้อมูลให้ครบ แล้วกดยืนยันเพื่อรับหมายเลขคิว", "Lengkapkan maklumat dan sahkan untuk mendapatkan nombor giliran")}</p>
            </div>
            <Suspense fallback={<BookingFormLoading locale={locale} />}>
              <BookingForm today={today} lastBookingDate={lastBookingDate} />
            </Suspense>
          </section>

          <aside className="space-y-4">
            {latestQueueId && (
              <Link href={`/queue/${latestQueueId}`} className="group flex items-center justify-between rounded-2xl border border-primary/20 bg-white p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/40">
                <span>
                  <span className="block text-xs font-semibold text-primary">{t("คิวของฉัน", "Giliran saya")}</span>
                  <span className="mt-1 block font-semibold">{t("ดูคิวที่จองล่าสุด", "Lihat tempahan terkini")}</span>
                </span>
                <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="text-sm font-semibold">{t("ก่อนเข้ารับบริการ", "Sebelum lawatan")}</p>
              <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-3"><span className="font-bold text-primary">01</span><span>{t("เลือกวันและบริการที่ต้องการ", "Pilih tarikh dan perkhidmatan")}</span></li>
                <li className="flex gap-3"><span className="font-bold text-primary">02</span><span>{t("รับเลขคิวและเก็บหน้าคิวไว้", "Dapatkan nombor dan simpan halaman giliran")}</span></li>
                <li className="flex gap-3"><span className="font-bold text-primary">03</span><span>{t("ติดตามสถานะในวันที่จอง", "Semak status pada tarikh tempahan")}</span></li>
              </ol>
            </div>
            <Link href="/about" className="block px-1 text-sm font-medium text-primary hover:underline">{t("รู้จักสหกรณ์อิสลามบีนา จำกัด", "Kenali Bina Islamic Cooperative")} <ArrowRight className="ml-1 inline size-4" /></Link>
          </aside>
        </div>
      </main>
    </>
  );
}
