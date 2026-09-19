import { DisplayBoard } from "@/components/display/display-board";
import { getQueueMonitorData } from "@/lib/queries/queues";

export const metadata = {
  title: "จอแสดงคิว - QFlow",
};

export default async function DisplayPage() {
  const { counters, queues } = await getQueueMonitorData();
  const calledQueues = queues
    .filter((queue) => queue.called_at)
    .sort((a, b) => (b.called_at ?? "").localeCompare(a.called_at ?? ""));
  const recentCalls = calledQueues.filter(
    (queue, index) => index < 10 || ["called", "serving"].includes(queue.status),
  );

  return <DisplayBoard recentCalls={recentCalls} counters={counters} />;
}
