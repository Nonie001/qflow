import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeleteAllDataButton } from "@/components/admin/delete-all-data-button";
import { getAllServices } from "@/lib/queries/services";
import { getAllCounters } from "@/lib/queries/counters";
import {
  createService,
  toggleServiceActive,
  deleteService,
  createCounter,
  toggleCounterActive,
  deleteCounter,
} from "@/lib/actions/admin-actions";
import { getLocale } from "@/lib/i18n-server";
import { localizeName, translate } from "@/lib/i18n";

export default async function AdminServicesPage() {
  const [services, counters] = await Promise.all([getAllServices(), getAllCounters()]);
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("ตั้งค่าระบบคิว", "Tetapan sistem giliran")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("บริการและช่องเรียกคิว", "Perkhidmatan dan kaunter")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("เพิ่ม ปิดใช้งาน หรือจัดการบริการที่เปิดรับคิว", "Tambah atau urus perkhidmatan yang menerima tempahan")}</p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("เพิ่มบริการใหม่", "Tambah perkhidmatan baharu")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createService} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("ชื่อบริการ", "Nama perkhidmatan")}</Label>
              <Input id="name" name="name" required className="w-56 max-w-full" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prefix">{t("ตัวอักษรนำหน้าคิว", "Awalan nombor giliran")}</Label>
              <Input id="prefix" name="prefix" required maxLength={2} className="w-24" />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              {t("เพิ่ม", "Tambah")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="divide-y p-0">
          {services.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("ยังไม่มีบริการ", "Tiada perkhidmatan")}</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-primary">
                  {service.prefix}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{localizeName(service.name, locale)}</p>
                  <StatusBadge active={service.is_active} />
                </div>
                <div className="flex gap-2">
                  <form action={toggleServiceActive.bind(null, service.id, !service.is_active)}>
                    <Button type="submit" variant="outline" size="sm">
                      {service.is_active ? t("ปิดใช้งาน", "Nyahaktif") : t("เปิดใช้งาน", "Aktifkan")}
                    </Button>
                  </form>
                  <form action={deleteService.bind(null, service.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="border-t border-border pt-8">
        <h2 className="text-2xl font-bold tracking-tight">{t("ช่องเรียกคิว", "Kaunter panggilan")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("กำหนดจุดที่เจ้าหน้าที่ใช้เรียกคิว หน้าเรียกคิวจะแสดงเฉพาะช่องที่เปิดใช้งาน", "Tetapkan kaunter untuk kakitangan memanggil giliran. Hanya kaunter aktif akan dipaparkan")}
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("เพิ่มช่องเรียกคิว", "Tambah kaunter")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCounter} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="counter-name">{t("ชื่อช่อง", "Nama kaunter")}</Label>
              <Input
                id="counter-name"
                name="name"
                required
                placeholder={t("เช่น ช่อง 1", "Contoh: Kaunter 1")}
                className="w-56"
              />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              {t("เพิ่ม", "Tambah")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="divide-y p-0">
          {counters.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("ยังไม่มีช่องเรียกคิว", "Tiada kaunter")}</p>
          ) : (
            counters.map((counter) => (
              <div key={counter.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <div>
                  <p className="font-medium">{localizeName(counter.name, locale)}</p>
                  <StatusBadge active={counter.is_active} />
                </div>
                <div className="flex gap-2">
                  <form action={toggleCounterActive.bind(null, counter.id, !counter.is_active)}>
                    <Button type="submit" variant="outline" size="sm">
                      {counter.is_active ? t("ปิดใช้งาน", "Nyahaktif") : t("เปิดใช้งาน", "Aktifkan")}
                    </Button>
                  </form>
                  <form action={deleteCounter.bind(null, counter.id)}>
                    <Button type="submit" variant="ghost" size="sm" aria-label={`${t("ลบ", "Padam")} ${counter.name}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7">
        <div>
          <h2 className="text-sm font-semibold">{t("จัดการข้อมูลระบบ", "Urus data sistem")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("ลบข้อมูลทั้งหมดต้องยืนยันด้วยรหัสผ่านแอดมิน", "Pemadaman semua data memerlukan kata laluan pentadbir")}</p>
        </div>
        <DeleteAllDataButton />
      </div>
    </div>
  );
}
