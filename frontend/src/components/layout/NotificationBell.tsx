"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { fill } from "@/lib/format";
import { NOTIF_ICONS, notifText } from "@/lib/notifText";
import { priorityStyle } from "@/lib/reco";
import { cn } from "@/lib/utils";
import {
  getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification,
} from "@/services/notifications";

export function NotificationBell() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

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
  }, [load, pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!viewer) return null;

  const unread = items.filter((n) => !n.read).length;
  const pick = async (n: AppNotification) => {
    await markNotificationRead(viewer.id, n.id);
    setOpen(false);
  };

  return (
    <div className="ei-bell" ref={ref}>
      <button
        type="button"
        className="ei-iconbtn"
        aria-label={unread > 0 ? fill(t("notif.bell.aria"), { n: unread }) : t("notif.bell.title")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && <span className="ei-badge-dot">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="ei-pop" role="dialog" aria-label={t("notif.bell.title")}>
          <div className="ei-pop-head">
            <span className="ei-pop-title-main">{t("notif.bell.title")}</span>
            {unread > 0 && (
              <button type="button" className="ei-pop-action" onClick={() => markAllNotificationsRead(viewer)}>
                {t("notif.markAllRead")}
              </button>
            )}
          </div>

          <div className="ei-pop-list">
            {items.length === 0 ? (
              <p className="ei-pop-empty">{t("notif.bell.empty")}</p>
            ) : (
              items.slice(0, 6).map((n) => {
                const Icon = NOTIF_ICONS[n.type];
                const tx = notifText(n, t);
                const inner = (
                  <>
                    <span className={cn("ei-pop-icon", priorityStyle[n.severity])}>
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="ei-pop-text">
                      <span className="ei-pop-title">{tx.title}</span>
                      <span className="ei-pop-desc">{tx.desc}</span>
                      <span className="ei-pop-time">
                        {new Date(n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })} UTC
                      </span>
                    </span>
                    {!n.read && <span className="ei-dot" aria-hidden="true" />}
                  </>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} className="ei-pop-item" data-unread={!n.read} onClick={() => pick(n)}>
                    {inner}
                  </Link>
                ) : (
                  <button key={n.id} type="button" className="ei-pop-item" data-unread={!n.read} onClick={() => pick(n)}>
                    {inner}
                  </button>
                );
              })
            )}
          </div>

          <Link href="/notifications" className="ei-pop-foot" onClick={() => setOpen(false)}>
            {t("notif.bell.viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
