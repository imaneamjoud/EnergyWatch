import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import {
  CO2_KG_PER_KWH,
  PERIOD_TARGET_KWH_PER_METER,
  SILENT_AFTER_HOURS,
  TARIFF_PER_KWH,
} from "@/lib/config";
import type { Anomaly, AnomalyStatus, Severity } from "@/types";

export type Period = "24h" | "3d" | "7d";
export type ActivityType = "login" | "threshold" | "meter" | "user" | "anomaly";

const HOUR = 3600000;
const DAY = 24 * HOUR;

// Les données fictives se terminent à cet instant : il sert de "maintenant"
const REF = new Date(measurements[measurements.length - 1].timestamp).getTime();

const inScope = (id: string, scope?: string[]) =>
  !scope || scope.length === 0 || scope.includes(id);

const rowSum = (byB: Record<string, number>, scope?: string[]) =>
  Object.entries(byB).reduce((s, [id, v]) => (inScope(id, scope) ? s + v : s), 0);

// consommation par heure et par bâtiment (calculée une seule fois)
const hourlyMap = new Map<number, Record<string, number>>();
for (const m of measurements) {
  const t = new Date(m.timestamp).getTime();
  const row = hourlyMap.get(t) ?? {};
  row[m.buildingId] = (row[m.buildingId] ?? 0) + m.kwh;
  hourlyMap.set(t, row);
}
const hours = [...hourlyMap.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([t, byB]) => ({ t, byB }));

/* ---------- Pack A : KPI enrichis ---------- */
export async function getKpiTrends(scope?: string[]) {
  const cur = hours.filter((h) => h.t > REF - 24 * HOUR);
  const prev = hours.filter((h) => h.t > REF - 48 * HOUR && h.t <= REF - 24 * HOUR);
  const curSum = cur.reduce((s, h) => s + rowSum(h.byB, scope), 0);
  const prevSum = prev.reduce((s, h) => s + rowSum(h.byB, scope), 0);
  const trendPct = prevSum > 0 ? ((curSum - prevSum) / prevSum) * 100 : 0;

  let peak = { kwh: 0, timestamp: "" };
  let total = 0;
  for (const h of hours) {
    const v = rowSum(h.byB, scope);
    total += v;
    if (v > peak.kwh) peak = { kwh: v, timestamp: new Date(h.t).toISOString() };
  }

  const meterCount = meters.filter((m) => inScope(m.buildingId, scope)).length;
  const target = PERIOD_TARGET_KWH_PER_METER * meterCount;

  return {
    kwh24h: curSum,
    trendPct,
    sparkline: cur.map((h) => rowSum(h.byB, scope)),
    cost24h: curSum * TARIFF_PER_KWH,
    co2Kg24h: curSum * CO2_KG_PER_KWH,
    peak,
    periodTotal: total,
    target,
    targetPct: target > 0 ? (total / target) * 100 : 0,
  };
}

/* ---------- Pack B : graphiques avancés ---------- */
export async function getConsumptionSeries(period: Period, scope?: string[]) {
  const windowH = period === "24h" ? 24 : period === "3d" ? 72 : 168;
  const series = buildings
    .filter((b) => inScope(b.id, scope))
    .map((b) => ({ id: b.id, name: b.name }));
  const bucketMs = period === "7d" ? DAY : HOUR;

  const rows = new Map<number, Record<string, number>>();
  for (const h of hours) {
    if (h.t <= REF - windowH * HOUR) continue;
    const key = Math.floor(h.t / bucketMs) * bucketMs;
    const row = rows.get(key) ?? {};
    for (const s of series) row[s.id] = (row[s.id] ?? 0) + (h.byB[s.id] ?? 0);
    rows.set(key, row);
  }

  const data = [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, row]) => {
      const out: Record<string, number> = { ts };
      for (const s of series) out[s.id] = Math.round((row[s.id] ?? 0) * 10) / 10;
      return out;
    });

  return { series, data };
}

export async function getBuildingShare(scope?: string[]) {
  return buildings
    .filter((b) => inScope(b.id, scope))
    .map((b) => ({
      id: b.id,
      name: b.name,
      kwh: Math.round(hours.reduce((s, h) => s + (h.byB[b.id] ?? 0), 0)),
    }));
}

export async function getHeatmap(scope?: string[]) {
  const map = new Map<number, number[]>();
  for (const h of hours) {
    const day = Math.floor(h.t / DAY) * DAY;
    const arr = map.get(day) ?? new Array<number>(24).fill(0);
    arr[new Date(h.t).getUTCHours()] += rowSum(h.byB, scope);
    map.set(day, arr);
  }
  const rows = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, values]) => ({ day, values }));
  const max = rows.reduce((m, r) => Math.max(m, ...r.values), 0);
  return { rows, max };
}

export async function getTopMeters(n: number, scope?: string[]) {
  const totals = new Map<string, { meterId: string; buildingId: string; kwh: number }>();
  for (const m of measurements) {
    if (!inScope(m.buildingId, scope)) continue;
    const cur = totals.get(m.meterId) ?? { meterId: m.meterId, buildingId: m.buildingId, kwh: 0 };
    cur.kwh += m.kwh;
    totals.set(m.meterId, cur);
  }
  return [...totals.values()]
    .map((x) => ({ ...x, kwh: Math.round(x.kwh) }))
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, n);
}

/* ---------- Pack C : santé du système (admin) ---------- */
export async function getSystemHealth() {
  const lastByMeter = new Map<string, number>();
  let ingested24h = 0;
  for (const m of measurements) {
    const t = new Date(m.timestamp).getTime();
    lastByMeter.set(m.meterId, t);
    if (t > REF - 24 * HOUR) ingested24h++;
  }
  const silent = meters
    .filter((m) => REF - (lastByMeter.get(m.id) ?? 0) > SILENT_AFTER_HOURS * HOUR)
    .map((m) => {
      const last = lastByMeter.get(m.id);
      return {
        meterId: m.id,
        buildingId: m.buildingId,
        lastTs: last ? new Date(last).toISOString() : null,
      };
    });
  const expected = meters.length * 24;
  return {
    total: meters.length,
    transmitting: meters.length - silent.length,
    silent,
    ingested24h,
    ingestionRate: Math.round((ingested24h / expected) * 100),
    lastMeasurementTs: new Date(REF).toISOString(),
    // valeurs de démonstration, remplacées par un vrai /health de FastAPI
    api: { ok: true, latencyMs: 42 },
    cassandra: { ok: true, latencyMs: 8 },
  };
}

/* ---------- Pack D : anomalies et actions admin ---------- */
export async function getAnomalyOverview() {
  const severity: Record<Severity, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const status: Record<AnomalyStatus, number> = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  for (const a of anomalies) {
    severity[a.severity]++;
    status[a.status]++;
  }
  return { total: anomalies.length, severity, status };
}

export async function getPriorityQueue(n: number): Promise<Anomaly[]> {
  const rank: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return anomalies
    .filter((a) => a.status !== "RESOLVED")
    .sort((a, b) => rank[b.severity] - rank[a.severity] || b.timestamp.localeCompare(a.timestamp))
    .slice(0, n)
    .map((a) => ({ ...a }));
}

export async function setAnomalyStatus(id: string, status: AnomalyStatus) {
  const a = anomalies.find((x) => x.id === id);
  if (a) a.status = status;
}

export async function getRecentActivity() {
  const items: { id: string; type: ActivityType; actor: string; minutesAgo: number }[] = [
    { id: "e1", type: "login", actor: "Admin Principal", minutesAgo: 12 },
    { id: "e2", type: "anomaly", actor: "Sara Analyste", minutesAgo: 47 },
    { id: "e3", type: "threshold", actor: "Admin Principal", minutesAgo: 130 },
    { id: "e4", type: "meter", actor: "Admin Principal", minutesAgo: 300 },
    { id: "e5", type: "user", actor: "Admin Principal", minutesAgo: 1500 },
  ];
  return items.map((e) => ({
    id: e.id,
    type: e.type,
    actor: e.actor,
    ts: new Date(REF - e.minutesAgo * 60000).toISOString(),
  }));
}
