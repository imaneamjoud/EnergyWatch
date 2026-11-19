import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import { SILENT_AFTER_HOURS } from "@/lib/config";
import { HOUR, REF, lastMeasurementByMeter } from "@/services/common";

export type NotifType = "ANOMALY" | "SILENT_METER" | "SYSTEM";
export type NotifSeverity = "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type NotifKind = "anomaly" | "silent" | "sysIngest" | "sysDetect";

export interface AppNotification {
  id: string;
  kind: NotifKind;
  type: NotifType;
  severity: NotifSeverity;
  ts: string;
  read: boolean;
  params: Record<string, string | number>;
  href: string | null;
}

const readIds = new Set<string>();
let seeded = false;

function seed() {
  if (seeded) return;
  seeded = true;
  for (const a of anomalies) if (a.status === "RESOLVED") readIds.add(`anomaly:${a.id}`);
}

const notify = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ei-notifications"));
};

function build(): AppNotification[] {
  seed();
  const bName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const out: AppNotification[] = [];

  for (const a of anomalies) {
    const id = `anomaly:${a.id}`;
    out.push({
      id,
      kind: "anomaly",
      type: "ANOMALY",
      severity: a.severity,
      ts: a.timestamp,
      read: readIds.has(id),
      params: { meter: a.meterId, building: bName(a.buildingId), kwh: a.kwh, expected: a.expectedKwh },
      href: "/anomalies",
    });
  }

  const last = lastMeasurementByMeter();
  for (const m of meters) {
    const t = last.get(m.id);
    if (t && REF - t > SILENT_AFTER_HOURS * HOUR) {
      const id = `silent:${m.id}`;
      out.push({
        id,
        kind: "silent",
        type: "SILENT_METER",
        severity: "HIGH",
        ts: new Date(t + SILENT_AFTER_HOURS * HOUR).toISOString(),
        read: readIds.has(id),
        params: { meter: m.id, building: bName(m.buildingId), hours: Math.round((REF - t) / HOUR) },
        href: `/meters/${m.id}`,
      });
    }
  }

  const ingested = measurements.filter((x) => Date.parse(x.timestamp) > REF - 24 * HOUR).length;
  out.push({
    id: "system:ingest",
    kind: "sysIngest",
    type: "SYSTEM",
    severity: "INFO",
    ts: new Date(REF).toISOString(),
    read: readIds.has("system:ingest"),
    params: { count: ingested },
    href: null,
  });
  out.push({
    id: "system:detect",
    kind: "sysDetect",
    type: "SYSTEM",
    severity: "INFO",
    ts: new Date(REF - HOUR).toISOString(),
    read: readIds.has("system:detect"),
    params: { count: anomalies.length },
    href: "/anomalies",
  });

  return out.sort((a, b) => b.ts.localeCompare(a.ts));
}

export async function getNotifications(): Promise<AppNotification[]> {
  return build();
}

export async function getUnreadCount(): Promise<number> {
  return build().filter((n) => !n.read).length;
}

export async function markNotificationRead(id: string) {
  readIds.add(id);
  notify();
}

export async function markAllNotificationsRead() {
  for (const n of build()) readIds.add(n.id);
  notify();
}
