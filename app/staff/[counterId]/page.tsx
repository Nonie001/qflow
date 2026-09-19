import { redirect } from "next/navigation";

export default async function StaffCounterPage({
  params,
}: PageProps<"/staff/[counterId]">) {
  const { counterId } = await params;
  redirect(`/admin/call?counter=${encodeURIComponent(counterId)}`);
}
