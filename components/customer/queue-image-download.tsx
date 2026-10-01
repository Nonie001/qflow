"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

export function QueueImageDownload({ queueNumber, queueDate }: { queueNumber: string; queueDate: string }) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  async function saveImage() {
    const ticket = document.getElementById("queue-image");
    if (!ticket || saving) return;

    setSaving(true);
    try {
      await document.fonts.ready;
      const { toPng } = await import("html-to-image");
      const image = await toPng(ticket, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `qflow-${queueNumber.replace(/[^A-Za-z0-9-]/g, "")}-${queueDate}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error(t("บันทึกภาพไม่สำเร็จ กรุณาลองอีกครั้ง", "Gagal menyimpan imej. Sila cuba lagi"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex justify-end">
      <Button type="button" variant="outline" onClick={saveImage} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {t("บันทึกเป็นภาพ", "Simpan sebagai imej")}
      </Button>
    </div>
  );
}
