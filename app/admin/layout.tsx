import Link from "next/link";
import { Monitor } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { SignOutButton } from "@/components/staff/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { DeleteAllDataButton } from "@/components/admin/delete-all-data-button";
import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "แดชบอร์ด" },
  { href: "/admin/call", label: "เรียกคิว" },
  { href: "/admin/services", label: "บริการ" },
  { href: "/admin/queues", label: "คิวทั้งหมด" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <header className="border-b bg-background px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold tracking-tight">
              QFlow
            </Link>
            <AdminNav items={NAV} />
          </div>
          <div className="flex items-center gap-2">
            <DeleteAllDataButton />
            <Link
              href="/display"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Monitor className="size-4" />
              จอแสดงคิว
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
