"use client";

import { Bell, BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useLanguage } from "@/components/language-provider";

export function NotificationPrompt({ queueId }: { queueId: string }) {
  const { t } = useLanguage();
  const { state, enable } = usePushSubscription(queueId);

  if (state === "enabled") {
    return (
      <Card className="border-success/20 bg-accent shadow-none">
        <CardContent className="flex items-center gap-2 py-3 text-sm text-success">
          <BellRing className="size-4" />
          {t("เปิดการแจ้งเตือนแล้ว เราจะแจ้งเมื่อใกล้ถึงคิวของคุณ", "Pemberitahuan diaktifkan. Kami akan maklumkan apabila giliran anda hampir tiba")}
        </CardContent>
      </Card>
    );
  }

  if (state === "denied" || state === "unsupported") {
    return (
      <Card className="bg-white shadow-none">
        <CardContent className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <BellOff className="size-4" />
          {t("ไม่ได้เปิดการแจ้งเตือน คุณยังสามารถติดตามสถานะคิวได้ในหน้านี้โดยระบบจะอัปเดตทุก 10 วินาที", "Pemberitahuan tidak aktif. Anda masih boleh menyemak status giliran di halaman ini")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Bell className="size-4 shrink-0" />
          <p className="text-sm">{t("เปิดการแจ้งเตือนเพื่อรับข่าวสารเมื่อใกล้ถึงคิวของคุณ", "Aktifkan pemberitahuan apabila giliran anda hampir tiba")}</p>
        </div>
        <Button
          size="sm"
          onClick={enable}
          disabled={state === "requesting"}
          className="shrink-0"
        >
          {t("เปิดการแจ้งเตือน", "Aktifkan pemberitahuan")}
        </Button>
      </CardContent>
    </Card>
  );
}
