import { Badge } from "@/components/ui/badge";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge className={active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
      {active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
    </Badge>
  );
}
