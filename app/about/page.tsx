import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "เกี่ยวกับสหกรณ์อิสลามบีนา จำกัด | QFlow", "Tentang Bina Islamic Cooperative | QFlow"),
    description: translate(locale, "ประวัติ ข้อมูลทะเบียน วิสัยทัศน์ และพันธกิจของสหกรณ์อิสลามบีนา จำกัด", "Sejarah, pendaftaran, visi dan misi Bina Islamic Cooperative"),
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  const details = [
    [t("ชื่อสหกรณ์", "Nama koperasi"), t("สหกรณ์อิสลามบีนา จำกัด", "Bina Islamic Cooperative Ltd.")],
    [t("ประเภทสหกรณ์", "Jenis koperasi"), t("สหกรณ์บริการ", "Koperasi perkhidmatan")],
    [t("วันที่จดทะเบียน", "Tarikh pendaftaran"), t("10 พฤศจิกายน 2543", "10 November 2000")],
    [t("เลขทะเบียนสหกรณ์", "Nombor pendaftaran koperasi"), "บ.030243"],
    [t("เลขทะเบียนข้อบังคับ", "Nombor pendaftaran undang-undang kecil"), "9400000225509"],
    [t("วันสิ้นปีบัญชี", "Akhir tahun kewangan"), t("31 ธันวาคม", "31 Disember")],
  ];
  const missions = [
    t("ดำเนินการตามหลักการชารีอะห์", "Beroperasi mengikut prinsip Syariah"),
    t("พัฒนาผลิตภัณฑ์ทางการเงินอย่างต่อเนื่องและหลากหลาย", "Membangunkan produk kewangan yang pelbagai secara berterusan"),
    t("เป็นแหล่งเรียนรู้และข้อมูลสารสนเทศด้านเศรษฐกิจอิสลาม", "Menjadi pusat pembelajaran dan maklumat ekonomi Islam"),
    t("บริหารจัดการอย่างมีประสิทธิภาพ", "Mengurus organisasi dengan cekap"),
    t("มีระบบการดำเนินงานที่ชัดเจน โปร่งใส และตรวจสอบได้", "Mewujudkan operasi yang jelas, telus dan boleh diaudit"),
    t("บริการสมาชิกอย่างมีประสิทธิภาพและประทับใจ", "Memberi perkhidmatan yang cekap dan memuaskan kepada ahli"),
    t("บริหารจัดการสินเชื่อและหนี้สินอย่างเป็นระบบ", "Mengurus pembiayaan dan hutang secara sistematik"),
    t("ส่งเสริมสวัสดิการแก่สมาชิกและสังคมอย่างต่อเนื่อง", "Meningkatkan kebajikan ahli dan masyarakat secara berterusan"),
    t("พัฒนากลุ่มสมาชิกให้เข้มแข็ง", "Memperkukuh kumpulan ahli"),
    t("ส่งเสริมการออมและยกระดับเศรษฐกิจของสมาชิก", "Menggalakkan simpanan dan meningkatkan ekonomi ahli"),
  ];
  return (
    <>
    <PublicHeader />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/queue" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        {t("กลับไปรับคิว", "Kembali ke tempahan")}
      </Link>

      <header className="mt-7 grid items-center gap-8 rounded-[2rem] border border-[#dceee2] bg-[#edf7ef] px-6 py-9 sm:px-10 sm:py-12 md:grid-cols-[1fr_auto]">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("เรื่องราวของเรา", "Kisah kami")}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#123e2a] sm:text-4xl">{t("สหกรณ์อิสลามบีนา จำกัด", "Bina Islamic Cooperative Ltd.")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#547365] sm:text-base">
          {t("สหกรณ์บริการที่ดำเนินธุรกรรมทางการเงินตามหลักศาสนาอิสลาม โดยปราศจากดอกเบี้ย", "Koperasi perkhidmatan yang menjalankan urusan kewangan berlandaskan prinsip Islam tanpa faedah")}
        </p>
        </div>
        <Image src="/bina-logo.jpg" width={190} height={184} alt="Bina" className="mx-auto h-auto w-40 rounded-2xl bg-white shadow-sm sm:w-48" />
      </header>

      <div className="mt-12 grid gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-labelledby="history-title">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("จุดเริ่มต้น", "Permulaan")}</p>
          <h2 id="history-title" className="mt-2 text-2xl font-bold">{t("ประวัติและความเป็นมา", "Sejarah dan latar belakang")}</h2>
          <div className="mt-5 space-y-4 text-sm leading-8 text-muted-foreground sm:text-base">
            <p>
              {t("สหกรณ์อิสลามบีนา จำกัด จดทะเบียนจัดตั้งเมื่อวันที่ 10 พฤศจิกายน 2543 เพื่อให้สมาชิกและประชาชนในพื้นที่มีทางเลือกในการใช้บริการทางการเงินที่สอดคล้องกับหลักศาสนาอิสลาม", "Bina Islamic Cooperative Ltd. didaftarkan pada 10 November 2000 untuk menyediakan pilihan perkhidmatan kewangan yang selaras dengan prinsip Islam kepada ahli dan masyarakat setempat")}
            </p>
            <p>
              {t("สหกรณ์ดำเนินงานในพื้นที่จังหวัดชายแดนภาคใต้ ได้แก่ ปัตตานี ยะลา และนราธิวาส โดยยึดหลักการสหกรณ์แบบอิสลามและไม่ใช้ระบบดอกเบี้ย", "Koperasi beroperasi di wilayah selatan Thailand, iaitu Pattani, Yala dan Narathiwat, berasaskan prinsip koperasi Islam tanpa faedah")}
            </p>
            <p>
              {t("การก่อตั้งสหกรณ์เกิดจากความต้องการบริการทางการเงินที่ชาวมุสลิมสามารถมีส่วนร่วมได้ โดยไม่ขัดกับหลักการดำเนินชีวิตตามศาสนาอิสลาม", "Koperasi ini ditubuhkan untuk memenuhi keperluan perkhidmatan kewangan yang boleh digunakan oleh umat Islam tanpa bercanggah dengan cara hidup Islam")}
            </p>
          </div>
          <blockquote className="mt-8 rounded-2xl border-l-4 border-primary bg-secondary px-6 py-5 text-lg font-semibold text-[#1a6646]">
            {t("“เพราะอิสลามคือวิถีการดำเนินชีวิต”", "“Kerana Islam ialah cara hidup”")}
          </blockquote>
        </section>

        <section aria-labelledby="details-title">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("ข้อมูลสำคัญ", "Maklumat penting")}</p>
          <h2 id="details-title" className="mt-2 text-2xl font-bold">{t("ข้อมูลสหกรณ์", "Maklumat koperasi")}</h2>
          <Card className="mt-5 shadow-none">
            <CardContent>
              <dl className="divide-y">
                {details.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr]">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="vision-title" className="mt-14 rounded-[2rem] bg-[#145a3e] px-6 py-9 text-white sm:px-10">
        <div className="flex items-center gap-3">
          <HeartHandshake className="size-6 text-[#b8e9ca]" aria-hidden />
          <h2 id="vision-title" className="text-sm font-semibold text-[#b8e9ca]">{t("วิสัยทัศน์ของเรา", "Visi kami")}</h2>
        </div>
        <p className="mt-5 max-w-3xl text-2xl font-semibold leading-relaxed sm:text-3xl">
          {t("“สถาบันการเงินอิสลามที่มั่นคง เป็นที่พึ่งของสมาชิกและสังคม”", "“Institusi kewangan Islam yang kukuh, menjadi sandaran ahli dan masyarakat”")}
        </p>
      </section>

      <section aria-labelledby="mission-title" className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("สิ่งที่เราทำ", "Apa yang kami lakukan")}</p>
        <h2 id="mission-title" className="mt-2 text-2xl font-bold">{t("พันธกิจ", "Misi")}</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {missions.map((mission, index) => (
            <li key={mission} className="flex gap-4 rounded-2xl border border-border bg-white p-5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <span className="self-center leading-relaxed">{mission}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-14 border-t border-border pt-9 text-center">
        <p className="mb-4 text-sm text-muted-foreground">{t("พร้อมใช้บริการกับสหกรณ์อิสลามบีนา จำกัด", "Sedia menggunakan perkhidmatan Bina Islamic Cooperative?")}</p>
        <Link href="/queue" className={buttonVariants({ size: "lg" })}>
          {t("รับคิว", "Tempah giliran")} <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
    </>
  );
}
