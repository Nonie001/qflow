import { Ticket } from "lucide-react";
import { ServicePicker } from "@/components/customer/service-picker";
import { getActiveServices } from "@/lib/queries/services";

export async function QueueBooking() {
  if (!process.env.GOOGLE_APPS_SCRIPT_URL || !process.env.GOOGLE_APPS_SCRIPT_SECRET) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Ticket className="size-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">QFlow</h1>
        <p className="mt-2 text-muted-foreground">ระบบรับคิวอยู่ระหว่างเตรียมเปิดให้บริการ</p>
      </main>
    );
  }
  const services = await getActiveServices();

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-4 py-12 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-48 -z-10 h-96 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary),transparent_82%),transparent)]"
      />

      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Ticket className="size-7" />
      </div>

      <div className="mt-5 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight">รับคิว</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          กรอกชื่อและเลือกบริการที่ต้องการ แล้วติดตามสถานะคิวได้ทันที
        </p>
      </div>

      <div className="mt-8 w-full max-w-md">
        <ServicePicker services={services} />
      </div>
    </main>
  );
}
