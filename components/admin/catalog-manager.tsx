"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/status-badge";
import { useLanguage } from "@/components/language-provider";
import { localizeError, localizeName } from "@/lib/i18n";
import {
  createService, toggleServiceActive, deleteService,
  createCounter, assignCounterServices, toggleCounterActive, deleteCounter,
} from "@/lib/actions/admin-actions";
import type { Counter, Service } from "@/lib/types/domain";
import type { CatalogUsage } from "@/lib/db/client";

type Kind = "service" | "counter";

export function CatalogManager({ services, counters, usage }: { services: Service[]; counters: Counter[]; usage: CatalogUsage }) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<Kind, string | null>>({ service: null, counter: null });

  function run(kind: Kind, key: string, task: () => Promise<void>, success: string, form?: HTMLFormElement) {
    setErrors((current) => ({ ...current, [kind]: null }));
    setBusy(key);
    startTransition(async () => {
      try {
        await task();
        form?.reset();
        toast.success(success);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error && error.message.startsWith("ข้อมูลซ้ำ")
          ? kind === "service"
            ? t("รหัสคิวนี้ถูกใช้แล้ว กรุณาใช้ตัวอักษรอื่น", "Awalan ini sudah digunakan. Pilih huruf lain")
            : t("ชื่อช่องเรียกคิวนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น", "Nama kaunter ini sudah digunakan. Pilih nama lain")
          : error instanceof Error
            ? localizeError(error.message, locale)
            : t("ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง", "Tindakan gagal. Sila cuba lagi");
        setErrors((current) => ({ ...current, [kind]: message }));
        toast.error(message);
      } finally {
        setBusy(null);
      }
    });
  }

  function submit(event: FormEvent<HTMLFormElement>, kind: Kind) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      kind,
      `create-${kind}`,
      () => kind === "service" ? createService(data) : createCounter(data),
      kind === "service" ? t("เพิ่มบริการแล้ว", "Perkhidmatan ditambah") : t("เพิ่มช่องเรียกคิวแล้ว", "Kaunter ditambah"),
      form,
    );
  }

  function assign(event: FormEvent<HTMLFormElement>, counterId: string) {
    event.preventDefault();
    const serviceIds = new FormData(event.currentTarget).getAll("serviceIds").map(String);
    run("counter", `assign-${counterId}`, () => assignCounterServices(counterId, serviceIds),
      t("บันทึกบริการของช่องแล้ว", "Perkhidmatan kaunter disimpan"));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card className="shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold">{t("บริการ", "Perkhidmatan")} <span className="text-sm font-normal text-muted-foreground">({services.length})</span></CardTitle>
          <p className="text-sm text-muted-foreground">{t("สิ่งที่ลูกค้าเลือกเมื่อจองคิว ตัวอักษรนำหน้าใช้สร้างเลขคิว เช่น A001", "Pilihan pelanggan semasa menempah. Awalan membentuk nombor seperti A001")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={(event) => submit(event, "service")} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="service-name">{t("ชื่อบริการ", "Nama perkhidmatan")}</Label>
              <Input id="service-name" name="name" required maxLength={100} disabled={isPending} placeholder={t("เช่น บริการทั่วไป", "Contoh: Perkhidmatan am")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-prefix">{t("รหัสคิว", "Awalan")}</Label>
              <Input id="service-prefix" name="prefix" required maxLength={2} pattern="[A-Za-z]{1,2}" title={t("ใช้อักษร A–Z 1–2 ตัว", "Gunakan 1–2 huruf A–Z")} disabled={isPending} placeholder="A" className="uppercase" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {busy === "create-service" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("เพิ่มบริการ", "Tambah")}
            </Button>
          </form>
          {errors.service && <p role="alert" className="text-sm text-destructive">{errors.service}</p>}
          <div className="divide-y rounded-xl border border-border">
            {services.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t("ยังไม่มีบริการ เพิ่มรายการแรกด้านบน", "Tiada perkhidmatan. Tambah yang pertama di atas")}</p>
            ) : services.map((service) => (
              <div key={service.id} className="p-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-primary">{service.prefix}</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{localizeName(service.name, locale)}</p>
                    <StatusBadge active={service.is_active} />
                    {service.is_active && !counters.some((counter) => counter.is_active && counter.service_ids.includes(service.id)) && (
                      <p className="mt-1 text-xs text-amber-700">{t("ยังไม่มีช่องเปิดรับบริการนี้", "Belum ada kaunter aktif untuk perkhidmatan ini")}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button type="button" variant="outline" size="sm" disabled={isPending}
                      onClick={() => run("service", `toggle-${service.id}`, () => toggleServiceActive(service.id, !service.is_active),
                        service.is_active ? t("ปิดบริการแล้ว", "Perkhidmatan dinyahaktifkan") : t("เปิดบริการแล้ว", "Perkhidmatan diaktifkan"))}>
                      {service.is_active ? t("ปิด", "Tutup") : t("เปิด", "Buka")}
                    </Button>
                    {!usage.serviceIds.includes(service.id) && !counters.some((counter) => counter.service_ids.includes(service.id)) && (
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isPending}
                        aria-label={`${t("ลบ", "Padam")} ${service.name}`}
                        onClick={() => run("service", `delete-${service.id}`, () => deleteService(service.id), t("ลบบริการแล้ว", "Perkhidmatan dipadam"))}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                {usage.serviceIds.includes(service.id) && <p className="mt-2 pl-[3.25rem] text-xs text-muted-foreground">{t("มีประวัติคิว · ใช้ปุ่มปิดแทนการลบ", "Ada sejarah giliran · Nyahaktifkan untuk berhenti menggunakannya")}</p>}
                {!usage.serviceIds.includes(service.id) && counters.some((counter) => counter.service_ids.includes(service.id)) && <p className="mt-2 pl-[3.25rem] text-xs text-muted-foreground">{t("กำหนดให้ช่องเรียกคิวอยู่ · ถอดออกจากทุกช่องก่อนลบ", "Digunakan oleh kaunter · Keluarkan daripada semua kaunter sebelum memadam")}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold">{t("ช่องเรียกคิว", "Kaunter")} <span className="text-sm font-normal text-muted-foreground">({counters.length})</span></CardTitle>
          <p className="text-sm text-muted-foreground">{t("เลือกบริการที่แต่ละช่องรับได้ ช่องจะเรียกเฉพาะคิวของบริการที่เลือก", "Pilih perkhidmatan bagi setiap kaunter. Kaunter hanya memanggil giliran yang dipilih")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={(event) => submit(event, "counter")} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="counter-name">{t("ชื่อช่อง", "Nama kaunter")}</Label>
                <Input id="counter-name" name="name" required maxLength={100} disabled={isPending} placeholder={t("เช่น ช่อง 1", "Contoh: Kaunter 1")} />
              </div>
              <Button type="submit" disabled={isPending || !services.some((service) => service.is_active)} className="w-full sm:w-auto">
                {busy === "create-counter" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {t("เพิ่มช่อง", "Tambah kaunter")}
              </Button>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("บริการที่ช่องนี้รับ", "Perkhidmatan kaunter ini")}</legend>
              <div className="flex flex-wrap gap-2">
                {services.filter((service) => service.is_active).map((service) => (
                  <label key={service.id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <input type="checkbox" name="serviceIds" value={service.id} disabled={isPending} className="accent-primary" />
                    <span>{service.prefix} · {localizeName(service.name, locale)}</span>
                  </label>
                ))}
              </div>
              {services.every((service) => !service.is_active) && <p className="text-xs text-muted-foreground">{t("เพิ่มหรือเปิดบริการก่อนสร้างช่อง", "Tambah atau aktifkan perkhidmatan sebelum mencipta kaunter")}</p>}
            </fieldset>
          </form>
          {errors.counter && <p role="alert" className="text-sm text-destructive">{errors.counter}</p>}
          <div className="divide-y rounded-xl border border-border">
            {counters.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t("ยังไม่มีช่องเรียกคิว เพิ่มช่องแรกด้านบน", "Tiada kaunter. Tambah yang pertama di atas")}</p>
            ) : counters.map((counter) => (
              <div key={counter.id} className="p-3">
                <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{localizeName(counter.name, locale)}</p>
                    <StatusBadge active={counter.is_active} />
                  </div>
                  <div className="ml-auto flex gap-1">
                    <Button type="button" variant="outline" size="sm" disabled={isPending}
                      onClick={() => run("counter", `toggle-${counter.id}`, () => toggleCounterActive(counter.id, !counter.is_active),
                        counter.is_active ? t("ปิดช่องแล้ว", "Kaunter dinyahaktifkan") : t("เปิดช่องแล้ว", "Kaunter diaktifkan"))}>
                      {counter.is_active ? t("ปิด", "Tutup") : t("เปิด", "Buka")}
                    </Button>
                    {!usage.counterIds.includes(counter.id) && (
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isPending}
                        aria-label={`${t("ลบ", "Padam")} ${counter.name}`}
                        onClick={() => run("counter", `delete-${counter.id}`, () => deleteCounter(counter.id), t("ลบช่องแล้ว", "Kaunter dipadam"))}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                {usage.counterIds.includes(counter.id) && <p className="mt-1 text-xs text-muted-foreground">{t("มีประวัติคิว · ใช้ปุ่มปิดแทนการลบ", "Ada sejarah giliran · Nyahaktifkan untuk berhenti menggunakannya")}</p>}
                <details className="group mt-2 text-sm">
                  <summary className="cursor-pointer text-primary marker:text-primary">
                    {t("บริการที่รับ", "Perkhidmatan diterima")}: {services.filter((service) => counter.service_ids.includes(service.id)).map((service) => localizeName(service.name, locale)).join(", ") || "–"} · {t("แก้ไข", "Sunting")}
                  </summary>
                  <form onSubmit={(event) => assign(event, counter.id)} className="mt-3 space-y-3 rounded-lg bg-muted/40 p-3">
                    <fieldset className="flex flex-wrap gap-2">
                      <legend className="sr-only">{t("เลือกบริการ", "Pilih perkhidmatan")}</legend>
                      {services.filter((service) => service.is_active).map((service) => (
                        <label key={service.id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
                          <input type="checkbox" name="serviceIds" value={service.id} defaultChecked={counter.service_ids.includes(service.id)} disabled={isPending} className="accent-primary" />
                          <span>{service.prefix} · {localizeName(service.name, locale)}</span>
                        </label>
                      ))}
                    </fieldset>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {busy === `assign-${counter.id}` && <Loader2 className="size-4 animate-spin" />}
                      {t("บันทึกบริการ", "Simpan perkhidmatan")}
                    </Button>
                  </form>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
