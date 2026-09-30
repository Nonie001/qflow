import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function QueueNotFound() {
  const locale = await getLocale();
  const t = (th: string, ms: string) => translate(locale, th, ms);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <SearchX className="size-6" />
      </div>
      <h1 className="text-2xl font-bold">{t("ไม่พบคิวหรือไม่มีสิทธิ์เข้าถึง", "Giliran tidak ditemui atau akses tidak dibenarkan")}</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("กรุณาเปิดจากเบราว์เซอร์ที่ใช้รับคิว หากล้างคุกกี้แล้วโปรดติดต่อเจ้าหน้าที่", "Sila buka dengan pelayar yang digunakan untuk tempahan. Jika kuki telah dipadam, hubungi kakitangan")}</p>
      <Button size="lg" render={<Link href="/" />}>{t("กลับหน้ารับคิว", "Kembali ke tempahan")}</Button>
    </main>
  );
}
