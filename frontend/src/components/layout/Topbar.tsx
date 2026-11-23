"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { initials } from "@/lib/user";

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
    <header className="relative z-30 flex h-16 items-center justify-between gap-3 border-b bg-card/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <h1 className="hidden truncate text-sm text-muted-foreground md:block">
          {t("topbar.welcome")}, <span className="font-semibold text-foreground">{user.name}</span>
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />
        <LanguageToggle />
        <ThemeToggle />
        <NotificationBell />
        <Link href="/profile" className="ei-avatar ei-avatar-sm" aria-label={t("page.profile.title")} title={user.name}>
          {initials(user.name)}
        </Link>
        <Badge className="grad-emerald hidden border-0 text-white lg:inline-flex">{t(roleKey[user.role])}</Badge>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("topbar.logout")}
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("topbar.logout")}</span>
        </Button>
      </div>
    </header>
  );
}
