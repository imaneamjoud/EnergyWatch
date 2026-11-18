"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

const roleKey = {
  ADMIN: "role.ADMIN",
  ANALYST: "role.ANALYST",
  MANAGER: "role.MANAGER",
} as const;

export function Topbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
      <h1 className="text-sm text-muted-foreground">
        {t("topbar.welcome")}, <span className="font-semibold text-foreground">{user.name}</span>
      </h1>

      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label={t("topbar.notifications")}>
          <Bell className="h-4 w-4" />
        </Button>
        <Badge className="grad-emerald border-0 text-white">{t(roleKey[user.role])}</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("topbar.logout")}
        </Button>
      </div>
    </header>
  );
}
