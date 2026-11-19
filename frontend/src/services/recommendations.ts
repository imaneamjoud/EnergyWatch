import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import { NIGHT_RATIO_PCT, RISING_PCT, SILENT_AFTER_HOURS } from "@/lib/config";
import { DAY, HOUR, REF, inScope, isBusinessHour, lastMeasurementByMeter } from "@/services/common";
import type { Severity } from "@/types";

export type RecoType = "SILENT_METER" | "OPEN_ANOMALIES" | "NIGHT_LOAD" | "RISING" | "STABLE";
export type Priority = "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface Recommendation {
  id: string;
  type: RecoType;
  priority: Priority;
  buildingId: string;
  buildingName: string;
  params: Record<string, string | number>;
  done: boolean;
}

// Recommandations déjà prises en compte (conservées tant que la page n'est pas rechargée)
const doneIds = new Set<string>();

const PRIORITY_RANK: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
const SEV_RANK: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export async function getRecommendations(scope?: string[]): Promise<Recommendation[]> {
  const list: Omit<Recommendation, "done">[] = [];
  const scoped = buildings.filter((b) => inScope(b.id, scope));
  const name = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const flagged = new Set<string>();

  // 1. Compteurs silencieux
  const last = lastMeasurementByMeter();
  for (const m of meters) {
    if (!inScope(m.buildingId, scope)) continue;
    const t = last.get(m.id);
    if (t && REF - t > SILENT_AFTER_HOURS * HOUR) {
      flagged.add(m.buildingId);
      list.push({
        id: `silent:${m.id}`,
        type: "SILENT_METER",
        priority: "HIGH",
        buildingId: m.buildingId,
        buildingName: name(m.buildingId),
        params: { meter: m.id, building: name(m.buildingId), hours: Math.round((REF - t) / HOUR) },
      });
    }
  }

  // 2. Anomalies ouvertes
  for (const b of scoped) {
    const open = anomalies.filter((a) => a.buildingId === b.id && a.status !== "RESOLVED");
    if (open.length === 0) continue;
    flagged.add(b.id);
    const worst = [...open].sort(
      (x, y) => SEV_RANK[y.severity] - SEV_RANK[x.severity] || y.timestamp.localeCompare(x.timestamp)
    )[0];
    list.push({
      id: `anomalies:${b.id}`,
      type: "OPEN_ANOMALIES",
      priority: worst.severity,
      buildingId: b.id,
      buildingName: b.name,
      params: { count: open.length, building: b.name, meter: worst.meterId, kwh: worst.kwh, expected: worst.expectedKwh },
    });
  }

  // 3 et 4. Consommation nocturne et tendance sur les jours ouvrés
  const hourly = new Map<string, Map<number, number>>();
  for (const x of measurements) {
    if (!inScope(x.buildingId, scope)) continue;
    const t = Date.parse(x.timestamp);
    let h = hourly.get(x.buildingId);
    if (!h) {
      h = new Map<number, number>();
      hourly.set(x.buildingId, h);
    }
    h.set(t, (h.get(t) ?? 0) + x.kwh);
  }

  for (const b of scoped) {
    const h = hourly.get(b.id);
    if (!h) continue;
    let nightSum = 0, nightN = 0, bizSum = 0, bizN = 0;
    const weekdayTotals = new Map<number, number>();
    for (const [t, v] of h) {
      const d = new Date(t);
      const hr = d.getUTCHours();
      const dow = d.getUTCDay();
      if (isBusinessHour(t)) {
        bizSum += v;
        bizN++;
      } else if (hr >= 22 || hr < 6) {
        nightSum += v;
        nightN++;
      }
      if (dow >= 1 && dow <= 5) {
        const day = Math.floor(t / DAY) * DAY;
        weekdayTotals.set(day, (weekdayTotals.get(day) ?? 0) + v);
      }
    }

    if (bizN > 0 && nightN > 0 && bizSum > 0) {
      const pct = (nightSum / nightN / (bizSum / bizN)) * 100;
      if (pct > NIGHT_RATIO_PCT) {
        flagged.add(b.id);
        list.push({
          id: `night:${b.id}`,
          type: "NIGHT_LOAD",
          priority: "MEDIUM",
          buildingId: b.id,
          buildingName: b.name,
          params: { building: b.name, pct: Math.round(pct) },
        });
      }
    }

    const days = [...weekdayTotals.entries()].sort((a, c) => a[0] - c[0]).map(([, v]) => v);
    if (days.length >= 3) {
      const lastDay = days[days.length - 1];
      const prev = days.slice(0, -1);
      const avg = prev.reduce((s, v) => s + v, 0) / prev.length;
      const pct = avg > 0 ? ((lastDay - avg) / avg) * 100 : 0;
      if (pct > RISING_PCT) {
        flagged.add(b.id);
        list.push({
          id: `rising:${b.id}`,
          type: "RISING",
          priority: "MEDIUM",
          buildingId: b.id,
          buildingName: b.name,
          params: { building: b.name, pct: Math.round(pct) },
        });
      }
    }
  }

  // 5. Bâtiments stables
  for (const b of scoped) {
    if (hourly.has(b.id) && !flagged.has(b.id)) {
      list.push({
        id: `stable:${b.id}`,
        type: "STABLE",
        priority: "INFO",
        buildingId: b.id,
        buildingName: b.name,
        params: { building: b.name },
      });
    }
  }

  return list
    .map((r) => ({ ...r, done: doneIds.has(r.id) }))
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
        a.buildingName.localeCompare(b.buildingName)
    );
}

export async function setRecommendationDone(id: string, done: boolean) {
  if (done) doneIds.add(id);
  else doneIds.delete(id);
}
