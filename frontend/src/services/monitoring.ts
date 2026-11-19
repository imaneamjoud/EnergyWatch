import { measurements } from "@/mocks/data";
import { DAY, FIRST, inScope, round } from "@/services/common";

export type Granularity = "hour" | "day";

export interface MonitoringQuery {
  buildingId: string; // "ALL" ou identifiant
  meterId: string; // "ALL" ou identifiant
  from: string; // AAAA-MM-JJ
  to: string; // AAAA-MM-JJ (inclus)
  granularity: Granularity;
}

export async function getDataRange() {
  return {
    min: measurements[0].timestamp.slice(0, 10),
    max: measurements[measurements.length - 1].timestamp.slice(0, 10),
  };
}

export async function getMonitoring(q: MonitoringQuery, scope?: string[]) {
  const fromMs = Date.parse(`${q.from}T00:00:00Z`);
  const toMs = Date.parse(`${q.to}T00:00:00Z`) + DAY; // borne exclue
  const days = Math.max(1, Math.round((toMs - fromMs) / DAY));

  const pick = (start: number, end: number) => {
    const out: { t: number; kwh: number; meterId: string }[] = [];
    for (const x of measurements) {
      if (!inScope(x.buildingId, scope)) continue;
      if (q.buildingId !== "ALL" && x.buildingId !== q.buildingId) continue;
      if (q.meterId !== "ALL" && x.meterId !== q.meterId) continue;
      const t = Date.parse(x.timestamp);
      if (t >= start && t < end) out.push({ t, kwh: x.kwh, meterId: x.meterId });
    }
    return out;
  };

  const cur = pick(fromMs, toMs);
  const byHour = new Map<number, number>();
  const byDay = new Map<number, number>();
  const meterSet = new Set<string>();
  let total = 0;
  for (const x of cur) {
    total += x.kwh;
    meterSet.add(x.meterId);
    byHour.set(x.t, (byHour.get(x.t) ?? 0) + x.kwh);
    const d = Math.floor(x.t / DAY) * DAY;
    byDay.set(d, (byDay.get(d) ?? 0) + x.kwh);
  }

  const daily: { day: number; kwh: number }[] = [];
  for (let d = fromMs; d < toMs; d += DAY) daily.push({ day: d, kwh: round(byDay.get(d) ?? 0) });

  const hourly = [...byHour.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, kwh]) => ({ ts, kwh: round(kwh, 2) }));
  const series = q.granularity === "hour" ? hourly : daily.map((d) => ({ ts: d.day, kwh: d.kwh }));

  const maxDay = daily.reduce<{ day: number; kwh: number } | null>(
    (m, d) => (d.kwh > 0 && (!m || d.kwh > m.kwh) ? d : m),
    null
  );
  const peakHour = hourly.reduce<{ ts: number; kwh: number } | null>(
    (m, h) => (!m || h.kwh > m.kwh ? h : m),
    null
  );

  // Évolution par rapport à la période précédente de même durée (si elle existe dans les données)
  let trendPct: number | null = null;
  const prevStart = fromMs - days * DAY;
  if (prevStart >= Math.floor(FIRST / DAY) * DAY) {
    const prevTotal = pick(prevStart, fromMs).reduce((s, x) => s + x.kwh, 0);
    if (prevTotal > 0) trendPct = ((total - prevTotal) / prevTotal) * 100;
  }

  return {
    total: round(total),
    avgDaily: round(total / days),
    maxDay,
    peakHour,
    trendPct,
    daily,
    series,
    days,
    readings: cur.length,
    meterCount: meterSet.size,
  };
}
