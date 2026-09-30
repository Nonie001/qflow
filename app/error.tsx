"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-2xl font-bold">{t("โหลดข้อมูลไม่สำเร็จ", "Gagal memuatkan data")}</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("กรุณาลองใหม่อีกครั้ง หากยังใช้งานไม่ได้โปรดติดต่อเจ้าหน้าที่", "Sila cuba lagi. Jika masalah berterusan, hubungi kakitangan")}</p>
      <Button size="lg" onClick={reset}>{t("ลองใหม่", "Cuba lagi")}</Button>
    </main>
  );
}
