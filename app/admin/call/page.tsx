import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StaffWorkspace } from "@/components/staff/staff-workspace";
import { getQueueMonitorData } from "@/lib/queries/queues";

export default async function AdminCallQueuePage({
  searchParams,
}: PageProps<"/admin/call">) {
  const query = await searchParams;
  const { counters, queues } = await getQueueMonitorData();
  const requestedCounterId = typeof query.counter === "string" ? query.counter : null;
  const counter = counters.find((item) => item.id === requestedCounterId) ?? counters[0];

  if (!counter) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">เรียกคิว</h1>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีจุดให้บริการที่เปิดใช้งาน
          </CardContent>
        </Card>
      </div>
    );
  }

  const waitingQueues = queues.filter((queue) => queue.status === "waiting");
  const currentQueue = queues.find(
    (queue) => queue.counter_id === counter.id && ["called", "serving"].includes(queue.status),
  ) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">เรียกคิว</h1>
        {counters.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="เลือกจุดให้บริการ">
            {counters.map((item) => (
              <Link
                key={item.id}
                href={`/admin/call?counter=${encodeURIComponent(item.id)}`}
                className={buttonVariants({
                  variant: item.id === counter.id ? "default" : "outline",
                  size: "sm",
                })}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <StaffWorkspace
        key={counter.id}
        counter={counter}
        currentQueue={currentQueue}
        waitingQueues={waitingQueues}
      />
    </div>
  );
}
