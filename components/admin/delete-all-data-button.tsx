"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAllData } from "@/lib/actions/admin-actions";
import { useLanguage } from "@/components/language-provider";
import { localizeError } from "@/lib/i18n";

export function DeleteAllDataButton() {
  const { t, locale } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    setError(null);
    startTransition(async () => {
      const result = await deleteAllData(password);
      if (result.error) {
        setError(localizeError(result.error, locale));
        return;
      }
      form.reset();
      dialogRef.current?.close();
      toast.success(t("ลบข้อมูลทั้งหมดแล้ว", "Semua data telah dipadam"));
      router.push("/admin/services");
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={openDialog}>
        <Trash2 className="size-4" />
        {t("ลบข้อมูลทั้งหมด", "Padam semua data")}
      </Button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50"
        onClose={() => setError(null)}
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("ลบข้อมูลทั้งหมด", "Padam semua data")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("บริการ ช่องเรียกคิว และประวัติคิวทั้งหมดจะถูกลบถาวรและกู้คืนไม่ได้", "Perkhidmatan, kaunter dan sejarah giliran akan dipadam secara kekal dan tidak boleh dipulihkan")}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delete-admin-password">{t("รหัสผ่านแอดมิน", "Kata laluan pentadbir")}</Label>
            <Input
              id="delete-admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => dialogRef.current?.close()}
            >
              {t("ยกเลิก", "Batal")}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {t("ยืนยันลบถาวร", "Sahkan pemadaman kekal")}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
