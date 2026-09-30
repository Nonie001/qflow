"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, Check, Loader2, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQueue } from "@/lib/actions/queue-actions";
import { addDaysToDate } from "@/lib/utils/date";
import { formatDate, localizeError, localizeName } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import type { Service } from "@/lib/types/domain";

function StepHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{number}</span>
      <div>
        <h3 className="text-base font-semibold leading-8">{title}</h3>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ServicePicker({ services, today, lastBookingDate }: { services: Service[]; today: string; lastBookingDate: string }) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const requestRef = useRef<{ key: string; id: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState(today);
  const tomorrow = addDaysToDate(today, 1);
  const selectedService = services.find((service) => service.id === selectedServiceId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = customerName.trim();
    if (!selectedService) {
      toast.error(t("กรุณาเลือกบริการที่ต้องการ", "Sila pilih perkhidmatan"));
      return;
    }
    if (!name) {
      toast.error(t("กรุณากรอกชื่อผู้รับบริการ", "Sila masukkan nama pelanggan"));
      document.getElementById("customer-name")?.focus();
      return;
    }
    if (!bookingDate || bookingDate < today || bookingDate > lastBookingDate) {
      toast.error(t("กรุณาเลือกวันที่ภายใน 30 วัน", "Sila pilih tarikh dalam tempoh 30 hari"));
      return;
    }
    const requestKey = `${selectedService.id}:${bookingDate}:${name}`;
    if (requestRef.current?.key !== requestKey) requestRef.current = { key: requestKey, id: crypto.randomUUID() };
    const requestId = requestRef.current.id;
    startTransition(async () => {
      try {
        const { queue } = await createQueue(selectedService.id, requestId, name, bookingDate);
        router.push(`/queue/${queue.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? localizeError(err.message, locale) : t("รับคิวไม่สำเร็จ กรุณาลองใหม่", "Tempahan gagal. Sila cuba lagi"));
      }
    });
  }

  if (services.length === 0) {
    return (
      <Card className="border-dashed bg-muted/40 shadow-none">
        <CardContent className="py-9 text-center text-sm text-muted-foreground">{t("ขณะนี้ยังไม่มีบริการเปิดให้รับคิว", "Tiada perkhidmatan tersedia untuk tempahan sekarang")}</CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section aria-label={t("เลือกวันที่เข้ารับบริการ", "Pilih tarikh lawatan")}>
        <StepHeading number="01" title={t("เลือกวันที่เข้ารับบริการ", "Pilih tarikh lawatan")} description={t("เลือกได้ตั้งแต่วันนี้ถึง 30 วันข้างหน้า", "Pilih dari hari ini hingga 30 hari akan datang")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button type="button" aria-pressed={bookingDate === today} onClick={() => setBookingDate(today)} disabled={isPending}
            className={`rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${bookingDate === today ? "border-primary bg-accent text-primary" : "border-border bg-white hover:border-primary/40"}`}>
            <span className="block text-sm font-semibold">{t("วันนี้", "Hari ini")}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{formatDate(today, locale)}</span>
          </button>
          <button type="button" aria-pressed={bookingDate === tomorrow} onClick={() => setBookingDate(tomorrow)} disabled={isPending}
            className={`rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${bookingDate === tomorrow ? "border-primary bg-accent text-primary" : "border-border bg-white hover:border-primary/40"}`}>
            <span className="block text-sm font-semibold">{t("พรุ่งนี้", "Esok")}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{formatDate(tomorrow, locale)}</span>
          </button>
          <div className="col-span-2 flex items-center gap-2 rounded-xl border border-border bg-white px-3 sm:col-span-1">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
            <Input id="booking-date" type="date" value={bookingDate} min={today} max={lastBookingDate}
              onChange={(event) => setBookingDate(event.target.value)} required disabled={isPending}
              aria-label={t("เลือกวันที่อื่น", "Pilih tarikh lain")} className="h-12 min-w-0 border-0 px-0 shadow-none focus-visible:border-0 focus-visible:ring-0" />
          </div>
        </div>
      </section>

      <section aria-label={t("เลือกบริการ", "Pilih perkhidmatan")}>
        <StepHeading number="02" title={t("เลือกบริการที่ต้องการ", "Pilih perkhidmatan")} description={t("หนึ่งการจองสำหรับหนึ่งประเภทบริการ", "Satu tempahan untuk satu jenis perkhidmatan")} />
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => {
            const selected = selectedServiceId === service.id;
            return (
              <button key={service.id} type="button" aria-pressed={selected} disabled={isPending}
                onClick={() => setSelectedServiceId(service.id)}
                className={`group flex min-h-20 items-center gap-3 rounded-xl border p-3.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? "border-primary bg-accent/70 shadow-sm" : "border-border bg-white hover:border-primary/40 hover:bg-muted/30"}`}>
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selected ? "bg-primary text-white" : "bg-secondary text-primary"}`}>{service.prefix}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{localizeName(service.name, locale)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t("คิว", "Giliran")} {service.prefix} · {t("เลือกบริการนี้", "Pilih perkhidmatan ini")}</span>
                </span>
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-input text-transparent"}`}>
                  <Check className="size-3" aria-hidden />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label={t("กรอกชื่อผู้รับบริการ", "Masukkan nama pelanggan")}>
        <StepHeading number="03" title={t("ข้อมูลผู้รับบริการ", "Maklumat pelanggan")} description={t("ชื่อจะแสดงบนหน้าคิว จอทีวี และหน้าจัดการของเจ้าหน้าที่", "Nama akan dipaparkan pada halaman giliran, skrin TV dan paparan kakitangan")} />
        <Label htmlFor="customer-name" className="mb-2">{t("ชื่อผู้รับบริการ", "Nama pelanggan")}</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id="customer-name" name="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)}
            placeholder={t("กรอกชื่อของคุณ", "Masukkan nama anda")} autoComplete="name" maxLength={100} required disabled={isPending} className="h-12 pl-11" />
        </div>
      </section>

      <div className="border-t border-border pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{t("สรุปการจอง", "Ringkasan tempahan")}</span>
          <span className="font-medium text-foreground">{selectedService ? localizeName(selectedService.name, locale) : t("ยังไม่เลือกบริการ", "Belum memilih perkhidmatan")} · {formatDate(bookingDate || today, locale)}</span>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <>{t("ยืนยันรับคิว", "Sahkan tempahan")} <ArrowRight className="size-4" /></>}
        </Button>
        <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">{t("หลังยืนยัน ระบบจะออกหมายเลขคิวสำหรับวันที่เลือกทันที", "Selepas pengesahan, nombor giliran untuk tarikh pilihan akan dikeluarkan serta-merta")}</p>
      </div>
    </form>
  );
}
