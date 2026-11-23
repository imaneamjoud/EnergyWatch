"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/format";
import { NOTIF_ICONS, notifText } from "@/lib/notifText";
import { priorityStyle } from "@/lib/reco";
import { cn } from "@/lib/utils";
import {
  getNotifications, markAllNotificationsRead, markNotificationRead,
  type AppNotification, type NotifType,
} from "@/services/notifications";
import type { TranslationKey } from "@/i18n/dictionaries";

type Filter = "ALL" | "UNREAD" | NotifType;

const FILTERS: { key: Filter; label: TranslationKey }[] = [
  { key: "ALL", label: "notif.filter.all" },
  { key: "UNREAD", label: "notif.filter.unread" },
  { key: "ANOMALY", label: "notif.filter.anomaly" },
  { key: "SILENT_METER", label: "notif.filter.meters" },
  { key: "SYSTEM", label: "notif.filter.system" },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  const viewer = useMemo(
    () => (user ? { id: user.id, role: user.role, buildingIds: user.buildingIds } : null),
    [user]
  );

  const load = useCallback(async () => {
    if (viewer) setItems(await getNotifications(viewer));
  }, [viewer]);

  useEffect(() => {
    load();
    window.addEventListener("ei-notifications", load);
    return () => window.removeEventListener("ei-notifications", load);
  }, [load]);

  const visible = useMemo(
    () => (items ?? []).filter((n) => (filter === "ALL" ? true : filter === "UNREAD" ? !n.read : n.type === filter)),
    [items, filter]
  );

  if (!viewer || !items) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const unread = items.filter((n) => !n.read).length;
  // Les responsables n'ont pas de notifications système
  const filters = FILTERS.filter((f) => f.key !== "SYSTEM" || viewer.role !== "MANAGER");

  return (
    <div className="ei-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.notifications.title" descKey="page.notifications.desc" />
        <Button variant="outline" onClick={() => markAllNotificationsRead(viewer)} disabled={unread === 0}>
          <CheckCheck className="mr-2 h-4 w-4" />
          {t("notif.markAllRead")}
        </Button>
      </div>

      <div className="ei-filter-row">
        <div className="ei-pills">
          {filters.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className="ei-pill">
              {t(f.label)}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{fill(t("notif.unreadCount"), { n: unread })}</span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">{t("notif.empty")}</p>
      ) : (
        <ul className="ei-list">
          {visible.map((n) => {
            const Icon = NOTIF_ICONS[n.type];
            const tx = notifText(n, t);
            return (
              <li key={n.id} className="ei-notif" data-unread={!n.read}>
                <span className={cn("ei-notif-icon", priorityStyle[n.severity])}>
                  <Icon size={20} aria-hidden="true" />
                </span>

                <div className="ei-notif-body">
                  <p className="ei-notif-title">
                    {!n.read && <span className="ei-dot" style={{ marginTop: 0 }} aria-hidden="true" />}
                    <span className={n.read ? "font-medium" : "font-semibold"}>{tx.title}</span>
                  </p>
                  <p className="ei-notif-desc">{tx.desc}</p>
                  <p className="ei-notif-time">
                    {new Date(n.ts).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC
                  </p>
                </div>

                <div className="ei-notif-side">
                  {n.href && (
                    <Link href={n.href} onClick={() => markNotificationRead(viewer.id, n.id)} className="text-primary hover:underline">
                      {t("notif.open")}
                    </Link>
                  )}
                  {!n.read && (
                    <button type="button" onClick={() => markNotificationRead(viewer.id, n.id)} className="text-muted-foreground hover:text-foreground">
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
