import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueueStatusBadge } from "@/components/queue-status-badge";
import { getTodayAllQueues } from "@/lib/queries/queues";
import { formatTimeTH } from "@/lib/utils/date";

export default async function AdminQueuesPage() {
  const queues = await getTodayAllQueues();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">คิวทั้งหมดวันนี้</h1>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขคิว</TableHead>
              <TableHead>ชื่อผู้รับบริการ</TableHead>
              <TableHead>บริการ</TableHead>
              <TableHead>ช่องบริการ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>เวลารับคิว</TableHead>
              <TableHead>เวลาที่เรียก</TableHead>
              <TableHead>เวลาเสร็จสิ้น</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  ยังไม่มีคิววันนี้
                </TableCell>
              </TableRow>
            ) : (
              queues.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.queue_number}</TableCell>
                  <TableCell>{q.customer_name || "ไม่ระบุชื่อ"}</TableCell>
                  <TableCell>{q.service?.name}</TableCell>
                  <TableCell>{q.counter?.name ?? "-"}</TableCell>
                  <TableCell>
                    <QueueStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell>{formatTimeTH(q.created_at)}</TableCell>
                  <TableCell>{formatTimeTH(q.called_at)}</TableCell>
                  <TableCell>{formatTimeTH(q.completed_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
