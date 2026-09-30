"use client";

"use client";

import { useActionState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthActionState } from "@/lib/actions/auth-actions";
import { useLanguage } from "@/components/language-provider";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username">{t("ชื่อผู้ใช้", "Nama pengguna")}</Label>
        <Input id="username" name="username" required autoComplete="username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("รหัสผ่าน", "Kata laluan")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : t("เข้าสู่ระบบ", "Log masuk")}
      </Button>
    </form>
  );
}
