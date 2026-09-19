"use client";

import { Bell, BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushSubscription } from "@/hooks/use-push-subscription";

export function NotificationPrompt({ queueId }: { queueId: string }) {
  const { state, enable } = usePushSubscription(queueId);

  if (state === "enabled") {
    return (
      <Card className="border-success/30 bg-success/10">
        <CardContent className="flex items-center gap-2 py-3 text-sm text-success">
          <BellRing className="size-4" />
          เปิดการแจ้งเตือนแล้ว เราจะแจ้งเมื่อใกล้ถึงคิวของคุณ
        </CardContent>
      </Card>
    );
  }

  if (state === "denied" || state === "unsupported") {
    return (
      <Card className="border-muted">
        <CardContent className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <BellOff className="size-4" />
          ไม่ได้เปิดการแจ้งเตือน คุณยังสามารถติดตามสถานะคิวได้ในหน้านี้โดยระบบจะอัปเดตทุก 10 วินาที
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Bell className="size-4 shrink-0" />
          <p className="text-sm">เปิดการแจ้งเตือนเพื่อรับข่าวสารเมื่อใกล้ถึงคิวของคุณ</p>
        </div>
        <Button
          size="sm"
          onClick={enable}
          disabled={state === "requesting"}
          className="shrink-0"
        >
          เปิดการแจ้งเตือน
        </Button>
      </CardContent>
    </Card>
  );
}
