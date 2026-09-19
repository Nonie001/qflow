import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAllServices } from "@/lib/queries/services";
import { getAllCounters } from "@/lib/queries/counters";
import {
  createService,
  toggleServiceActive,
  deleteService,
  createCounter,
  toggleCounterActive,
  deleteCounter,
} from "@/lib/actions/admin-actions";

export default async function AdminServicesPage() {
  const [services, counters] = await Promise.all([getAllServices(), getAllCounters()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">จัดการประเภทบริการ</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เพิ่มบริการใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createService} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">ชื่อบริการ</Label>
              <Input id="name" name="name" required className="w-56" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prefix">ตัวอักษรนำหน้าคิว</Label>
              <Input id="prefix" name="prefix" required maxLength={2} className="w-24" />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              เพิ่ม
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y p-0">
          {services.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">ยังไม่มีบริการ</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="flex items-center gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {service.prefix}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{service.name}</p>
                  <StatusBadge active={service.is_active} />
                </div>
                <div className="flex gap-2">
                  <form action={toggleServiceActive.bind(null, service.id, !service.is_active)}>
                    <Button type="submit" variant="outline" size="sm">
                      {service.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </Button>
                  </form>
                  <form action={deleteService.bind(null, service.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="border-t pt-6">
        <h2 className="text-xl font-bold tracking-tight">ช่องเรียกคิว</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          กำหนดจุดที่เจ้าหน้าที่ใช้เรียกคิว หน้าเรียกคิวจะแสดงเฉพาะช่องที่เปิดใช้งาน
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เพิ่มช่องเรียกคิว</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCounter} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="counter-name">ชื่อช่อง</Label>
              <Input
                id="counter-name"
                name="name"
                required
                placeholder="เช่น ช่อง 1"
                className="w-56"
              />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              เพิ่ม
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y p-0">
          {counters.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">ยังไม่มีช่องเรียกคิว</p>
          ) : (
            counters.map((counter) => (
              <div key={counter.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{counter.name}</p>
                  <StatusBadge active={counter.is_active} />
                </div>
                <div className="flex gap-2">
                  <form action={toggleCounterActive.bind(null, counter.id, !counter.is_active)}>
                    <Button type="submit" variant="outline" size="sm">
                      {counter.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </Button>
                  </form>
                  <form action={deleteCounter.bind(null, counter.id)}>
                    <Button type="submit" variant="ghost" size="sm" aria-label={`ลบ ${counter.name}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
