import { CatalogManager } from "@/components/admin/catalog-manager";
import { DeleteAllDataButton } from "@/components/admin/delete-all-data-button";
import { getAllServices } from "@/lib/queries/services";
import { getAllCounters } from "@/lib/queries/counters";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { dbAction, type CatalogUsage } from "@/lib/db/client";

export default async function AdminServicesPage() {
  const [services, counters, usage, locale] = await Promise.all([
    getAllServices(), getAllCounters(), dbAction<CatalogUsage>("catalog_usage"), getLocale(),
  ]);
  const t = (th: string, ms: string) => translate(locale, th, ms);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("ตั้งค่าระบบคิว", "Tetapan sistem giliran")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("บริการและช่องเรียกคิว", "Perkhidmatan dan kaunter")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("เพิ่มบริการที่ลูกค้าจองได้ และกำหนดช่องสำหรับเจ้าหน้าที่เรียกคิว", "Tambah perkhidmatan untuk ditempah dan kaunter untuk memanggil giliran")}</p>
      </div>

      <CatalogManager services={services} counters={counters} usage={usage} />

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
