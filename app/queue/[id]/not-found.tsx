import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QueueNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">ไม่พบคิวหรือไม่มีสิทธิ์เข้าถึง</h1>
      <p className="text-muted-foreground">กรุณาเปิดจากเบราว์เซอร์ที่ใช้รับคิว หากล้างคุกกี้แล้วโปรดติดต่อเจ้าหน้าที่</p>
      <Button render={<Link href="/" />}>กลับหน้ารับคิว</Button>
    </main>
  );
}
