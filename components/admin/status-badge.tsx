"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";

export function StatusBadge({ active }: { active: boolean }) {
  const { t } = useLanguage();
  return (
    <Badge className={active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
      {active ? t("เปิดใช้งาน", "Aktif") : t("ปิดใช้งาน", "Tidak aktif")}
    </Badge>
  );
}
