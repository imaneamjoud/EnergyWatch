import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import { SILENT_AFTER_HOURS } from "@/lib/config";
import { HOUR, REF, inScope, lastMeasurementByMeter } from "@/services/common";
import type { Role } from "@/types";

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

export interface Viewer {
  id: string;
  role: Role;
  buildingIds: string[];
}

// État "lu" propre à chaque utilisateur (conservé tant que la page n'est pas rechargée)
const readByUser = new Map<string, Set<string>>();
const seeded = new Set<string>();

function readSet(userId: string) {
  let set = readByUser.get(userId);
  if (!set) {
    set = new Set<string>();
    readByUser.set(userId, set);
  }
  if (!seeded.has(userId)) {
    seeded.add(userId);
    for (const a of anomalies) if (a.status === "RESOLVED") set.add(`anomaly:${a.id}`);
  }
  return set;
}

const notify = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ei-notifications"));
};

function build(viewer: Viewer): AppNotification[] {
  const reads = readSet(viewer.id);
  const bName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const out: AppNotification[] = [];

  for (const a of anomalies) {
    if (!inScope(a.buildingId, viewer.buildingIds)) continue;
    const id = `anomaly:${a.id}`;
    out.push({
      id,
      kind: "anomaly",
      type: "ANOMALY",
      severity: a.severity,
      ts: a.timestamp,
      read: reads.has(id),
      params: { meter: a.meterId, building: bName(a.buildingId), kwh: a.kwh, expected: a.expectedKwh },
      href: "/anomalies",
    });
  }

  const last = lastMeasurementByMeter();
  for (const m of meters) {
    if (!inScope(m.buildingId, viewer.buildingIds)) continue;
    const t = last.get(m.id);
    if (t && REF - t > SILENT_AFTER_HOURS * HOUR) {
      const id = `silent:${m.id}`;
      out.push({
        id,
        kind: "silent",
        type: "SILENT_METER",
        severity: "HIGH",
        ts: new Date(t + SILENT_AFTER_HOURS * HOUR).toISOString(),
        read: reads.has(id),
        params: { meter: m.id, building: bName(m.buildingId), hours: Math.round((REF - t) / HOUR) },
        href: `/meters/${m.id}`,
      });
    }
  }

  // Les notifications système ne concernent pas les responsables de bâtiment
  if (viewer.role !== "MANAGER") {
    const ingested = measurements.filter((x) => Date.parse(x.timestamp) > REF - 24 * HOUR).length;
    out.push({
      id: "system:ingest",
      kind: "sysIngest",
      type: "SYSTEM",
      severity: "INFO",
      ts: new Date(REF).toISOString(),
      read: reads.has("system:ingest"),
      params: { count: ingested },
      href: null,
    });
    out.push({
      id: "system:detect",
      kind: "sysDetect",
      type: "SYSTEM",
      severity: "INFO",
      ts: new Date(REF - HOUR).toISOString(),
      read: reads.has("system:detect"),
      params: { count: anomalies.length },
      href: "/anomalies",
    });
  }

  return out.sort((a, b) => b.ts.localeCompare(a.ts));
}

export async function getNotifications(viewer: Viewer): Promise<AppNotification[]> {
  return build(viewer);
}

export async function markNotificationRead(userId: string, id: string) {
  readSet(userId).add(id);
  notify();
}

export async function markAllNotificationsRead(viewer: Viewer) {
  const reads = readSet(viewer.id);
  for (const n of build(viewer)) reads.add(n.id);
  notify();
}
