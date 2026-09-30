"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth-actions";
import { useLanguage } from "@/components/language-provider";

export function SignOutButton() {
  const { t } = useLanguage();
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm" aria-label={t("ออกจากระบบ", "Log keluar")}>
        <LogOut className="size-4" />
        <span className="hidden sm:inline">{t("ออกจากระบบ", "Log keluar")}</span>
      </Button>
    </form>
  );
}
