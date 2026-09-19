"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="text-muted-foreground">กรุณาลองใหม่อีกครั้ง หากยังใช้งานไม่ได้โปรดติดต่อเจ้าหน้าที่</p>
      <Button onClick={reset}>ลองใหม่</Button>
    </main>
  );
}
