import { DisplayBoard } from "@/components/display/display-board";
import { getQueueMonitorData } from "@/lib/queries/queues";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "จอแสดงคิว - QFlow", "Paparan giliran - QFlow") };
}

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
