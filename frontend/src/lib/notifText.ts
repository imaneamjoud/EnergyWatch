import { AlertTriangle, Info, WifiOff, type LucideIcon } from "lucide-react";
import { fill } from "@/lib/format";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { AppNotification, NotifKind, NotifType } from "@/services/notifications";

const TEXT: Record<NotifKind, [TranslationKey, TranslationKey]> = {
  anomaly: ["notif.anomaly.title", "notif.anomaly.desc"],
  silent: ["notif.silent.title", "notif.silent.desc"],
  sysIngest: ["notif.sysIngest.title", "notif.sysIngest.desc"],
  sysDetect: ["notif.sysDetect.title", "notif.sysDetect.desc"],
};

export const NOTIF_ICONS: Record<NotifType, LucideIcon> = {
  ANOMALY: AlertTriangle,
  SILENT_METER: WifiOff,
  SYSTEM: Info,
};

export function notifText(n: AppNotification, t: (key: TranslationKey) => string) {
  const [title, desc] = TEXT[n.kind];
  return { title: fill(t(title), n.params), desc: fill(t(desc), n.params) };
}
