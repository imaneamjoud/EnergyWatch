"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCheck, Info, WifiOff, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessDenied } from "@/components/common/AccessDenied";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/format";
import { priorityStyle } from "@/lib/reco";
import { cn } from "@/lib/utils";
import {
  getNotifications, markAllNotificationsRead, markNotificationRead,
  type AppNotification, type NotifKind, type NotifType,
} from "@/services/notifications";
import type { TranslationKey } from "@/i18n/dictionaries";

type Filter = "ALL" | "UNREAD" | NotifType;

const TEXT: Record<NotifKind, [TranslationKey, TranslationKey]> = {
  anomaly: ["notif.anomaly.title", "notif.anomaly.desc"],
  silent: ["notif.silent.title", "notif.silent.desc"],
  sysIngest: ["notif.sysIngest.title", "notif.sysIngest.desc"],
  sysDetect: ["notif.sysDetect.title", "notif.sysDetect.desc"],
};
const ICONS: Record<NotifType, LucideIcon> = {
  ANOMALY: AlertTriangle,
  SILENT_METER: WifiOff,
  SYSTEM: Info,
};
const FILTERS: { key: Filter; label: TranslationKey }[] = [
  { key: "ALL", label: "notif.filter.all" },
  { key: "UNREAD", label: "notif.filter.unread" },
  { key: "ANOMALY", label: "notif.filter.anomaly" },
  { key: "SILENT_METER", label: "notif.filter.meters" },
  { key: "SYSTEM", label: "notif.filter.system" },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "ADMIN") return <AccessDenied />;
  return <NotificationsContent />;
}

function NotificationsContent() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  const load = useCallback(async () => {
    setItems(await getNotifications());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      (items ?? []).filter((n) =>
        filter === "ALL" ? true : filter === "UNREAD" ? !n.read : n.type === filter
      ),
    [items, filter]
  );

  const read = async (id: string) => {
    await markNotificationRead(id);
    await load();
  };
  const readAll = async () => {
    await markAllNotificationsRead();
    await load();
  };

  if (!items) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.notifications.title" descKey="page.notifications.desc" />
        <Button variant="outline" onClick={readAll} disabled={unread === 0}>
          <CheckCheck className="mr-2 h-4 w-4" />
          {t("notif.markAllRead")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              filter === f.key ? "grad-emerald border-transparent text-white shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(f.label)}
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{fill(t("notif.unreadCount"), { n: unread })}</span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">{t("notif.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((n) => {
            const Icon = ICONS[n.type];
            const [titleKey, descKey] = TEXT[n.kind];
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border bg-card p-4 shadow-sm",
                  !n.read && "border-emerald-500/40 bg-emerald-500/5"
                )}
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", priorityStyle[n.severity])}>
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />}
                    <p className={cn("text-sm", n.read ? "font-medium" : "font-semibold")}>{fill(t(titleKey), n.params)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{fill(t(descKey), n.params)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.ts).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 text-xs font-medium">
                  {n.href && (
                    <Link href={n.href} onClick={() => read(n.id)} className="text-primary hover:underline">
                      {t("notif.open")}
                    </Link>
                  )}
                  {!n.read && (
                    <button type="button" onClick={() => read(n.id)} className="text-muted-foreground hover:text-foreground">
                      {t("notif.markRead")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
