"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQueue } from "@/lib/actions/queue-actions";
import type { Service } from "@/lib/types/domain";

export function ServicePicker({ services }: { services: Service[] }) {
  const router = useRouter();
  const requestRef = useRef<{ serviceId: string; id: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  function handleSelect(service: Service) {
    const name = customerName.trim();
    if (!name) {
      toast.error("กรุณากรอกชื่อก่อนรับคิว");
      document.getElementById("customer-name")?.focus();
      return;
    }
    if (requestRef.current?.serviceId !== service.id) requestRef.current = { serviceId: service.id, id: crypto.randomUUID() };
    const requestId = requestRef.current.id;
    setSelectedId(service.id);
    startTransition(async () => {
      try {
        const { queue } = await createQueue(service.id, requestId, name);
        router.push(`/queue/${queue.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "รับคิวไม่สำเร็จ กรุณาลองใหม่");
        setSelectedId(null);
      }
    });
  }

  if (services.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          ขณะนี้ยังไม่มีบริการเปิดให้บริการ
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2 space-y-2">
        <Label htmlFor="customer-name">ชื่อผู้รับบริการ</Label>
        <Input
          id="customer-name"
          name="customerName"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="กรอกชื่อของคุณ"
          autoComplete="name"
          maxLength={100}
          required
          disabled={isPending}
          className="h-11"
        />
      </div>
      {services.map((service) => {
        const isBusy = isPending && selectedId === service.id;
        return (
          <Card
            key={service.id}
            className="overflow-hidden transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <CardContent className="flex items-center gap-4 py-1.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                {service.prefix}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">คิวขึ้นต้นด้วย {service.prefix}</p>
              </div>
              <Button
                onClick={() => handleSelect(service)}
                disabled={isPending}
                size="sm"
                className="shrink-0"
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    รับคิว <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
