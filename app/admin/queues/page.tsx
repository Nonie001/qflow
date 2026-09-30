import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueueStatusBadge } from "@/components/queue-status-badge";
import { getTodayAllQueues, getUpcomingQueues } from "@/lib/queries/queues";
import { formatDate, formatTime, localizeName, translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function AdminQueuesPage() {
  const [queues, upcomingQueues] = await Promise.all([getTodayAllQueues(), getUpcomingQueues()]);
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("รายการคิว", "Senarai giliran")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("คิวทั้งหมด", "Semua giliran")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("ตรวจสอบคิววันนี้และรายการที่จองล่วงหน้า", "Semak giliran hari ini dan tempahan akan datang")}</p>
      </div>

      <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("คิววันนี้", "Giliran hari ini")}</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{queues.length} {t("รายการ", "rekod")}</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("เลขคิว", "Nombor")}</TableHead>
              <TableHead>{t("ชื่อผู้รับบริการ", "Nama pelanggan")}</TableHead>
              <TableHead>{t("บริการ", "Perkhidmatan")}</TableHead>
              <TableHead>{t("ช่องบริการ", "Kaunter")}</TableHead>
              <TableHead>{t("สถานะ", "Status")}</TableHead>
              <TableHead>{t("เวลารับคิว", "Masa tempahan")}</TableHead>
              <TableHead>{t("เวลาที่เรียก", "Masa panggilan")}</TableHead>
              <TableHead>{t("เวลาเสร็จสิ้น", "Masa selesai")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {t("ยังไม่มีคิววันนี้", "Tiada giliran hari ini")}
                </TableCell>
              </TableRow>
            ) : (
              queues.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.queue_number}</TableCell>
                  <TableCell>{q.customer_name || t("ไม่ระบุชื่อ", "Tiada nama")}</TableCell>
                  <TableCell>{localizeName(q.service?.name, locale)}</TableCell>
                  <TableCell>{localizeName(q.counter?.name, locale)}</TableCell>
                  <TableCell>
                    <QueueStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell>{formatTime(q.created_at, locale)}</TableCell>
                  <TableCell>{formatTime(q.called_at, locale)}</TableCell>
                  <TableCell>{formatTime(q.completed_at, locale)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("คิวที่จองล่วงหน้า", "Tempahan akan datang")} <span className="ml-2 rounded-full bg-secondary px-3 py-1 align-middle text-xs font-semibold text-primary">{upcomingQueues.length}</span></h2>
          <p className="text-sm text-muted-foreground">{t("คิวเหล่านี้จะปรากฏในหน้าเรียกคิวเมื่อถึงวันที่จอง", "Giliran ini akan muncul pada halaman panggilan pada tarikh tempahan")}</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("วันที่เข้ารับบริการ", "Tarikh lawatan")}</TableHead>
                <TableHead>{t("เลขคิว", "Nombor")}</TableHead>
                <TableHead>{t("ชื่อผู้รับบริการ", "Nama pelanggan")}</TableHead>
                <TableHead>{t("บริการ", "Perkhidmatan")}</TableHead>
                <TableHead>{t("สถานะ", "Status")}</TableHead>
                <TableHead>{t("เวลาที่จอง", "Masa ditempah")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingQueues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{t("ยังไม่มีคิวจองล่วงหน้า", "Tiada tempahan akan datang")}</TableCell>
                </TableRow>
              ) : upcomingQueues.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{formatDate(q.queue_date, locale)}</TableCell>
                  <TableCell className="font-medium">{q.queue_number}</TableCell>
                  <TableCell>{q.customer_name || t("ไม่ระบุชื่อ", "Tiada nama")}</TableCell>
                  <TableCell>{localizeName(q.service?.name, locale)}</TableCell>
                  <TableCell><QueueStatusBadge status={q.status} /></TableCell>
                  <TableCell>{formatTime(q.created_at, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
