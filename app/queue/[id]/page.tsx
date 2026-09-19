import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getCustomerQueue } from "@/lib/queries/queues";
import { QueueStatusPanel } from "@/components/customer/queue-status-panel";
import { NotificationPrompt } from "@/components/customer/notification-prompt";

export default async function QueueStatusPage({
  params,
}: PageProps<"/queue/[id]">) {
  const { id } = await params;
  const result = await getCustomerQueue(id);
  if (!result) notFound();
  const { queue, position } = result;

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-4 flex w-full max-w-md items-center">
        <Link
          href="/queue"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          รับคิวใหม่
        </Link>
      </div>
      <div className="w-full max-w-md space-y-4">
        <QueueStatusPanel
          key={queue.id}
          initialQueue={queue}
          serviceName={queue.service?.name ?? "-"}
          counters={queue.counter ? [queue.counter] : []}
          initialPosition={position}
        />
        {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && queue.status === "waiting" && <NotificationPrompt queueId={queue.id} />}
      </div>
    </div>
  );
}
