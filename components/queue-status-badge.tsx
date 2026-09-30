"use client";

import { Badge } from "@/components/ui/badge";
import { type QueueStatus } from "@/lib/types/domain";
import { STATUS_LABELS } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

const STATUS_BADGE_CLASS: Record<QueueStatus, string> = {
  waiting: "bg-secondary text-secondary-foreground",
  called: "bg-warning/15 text-warning-foreground",
  serving: "bg-success/15 text-success",
  completed: "bg-muted text-muted-foreground",
  skipped: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
};

export function QueueStatusBadge({
  status,
  className,
  children,
}: {
  status: QueueStatus;
  className?: string;
  children?: React.ReactNode;
}) {
  const { locale } = useLanguage();
  return (
    <Badge className={`gap-1.5 ${STATUS_BADGE_CLASS[status]} ${className ?? ""}`}>
      {children}
      {STATUS_LABELS[locale][status]}
    </Badge>
  );
}
