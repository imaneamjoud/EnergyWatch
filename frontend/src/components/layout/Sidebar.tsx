"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();
  if (!user) return null;

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="grad-emerald flex h-9 w-9 items-center justify-center rounded-xl shadow-md shadow-emerald-500/30">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-brand-gradient text-lg font-bold">EnergyInsight</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {navigation.map((section) => {
          const items = section.items.filter((i) => i.roles.includes(user.role));
          if (items.length === 0) return null;
          return (
            <div key={section.titleKey}>
              <p className="mb-2 px-2 text-[11px] font-semibold tracking-wider text-muted-foreground">
                {t(section.titleKey)}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          active
                            ? "grad-emerald text-white shadow-md shadow-emerald-500/25"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
