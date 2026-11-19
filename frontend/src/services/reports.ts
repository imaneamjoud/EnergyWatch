import { anomalies, buildings, measurements } from "@/mocks/data";
import { CO2_KG_PER_KWH, TARIFF_PER_KWH } from "@/lib/config";
import { getBuildingStats } from "@/services/buildings";
import { DAY, inScope, round } from "@/services/common";
import { getRecommendations } from "@/services/recommendations";

export type ReportType = "SUMMARY" | "ANOMALIES" | "FULL";

export interface ReportQuery {
  buildingId: string; // "ALL" ou identifiant
  from: string; // AAAA-MM-JJ
  to: string; // AAAA-MM-JJ (inclus)
}

export async function getReportData(q: ReportQuery, scope?: string[]) {
  const fromMs = Date.parse(`${q.from}T00:00:00Z`);
  const toMs = Date.parse(`${q.to}T00:00:00Z`) + DAY;
  const days = Math.max(1, Math.round((toMs - fromMs) / DAY));
  const pick = (id: string) => inScope(id, scope) && (q.buildingId === "ALL" || id === q.buildingId);
  const name = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;

  const byDay = new Map<number, number>();
  const byMeter = new Map<string, { meterId: string; buildingId: string; kwh: number }>();
  const byBuilding = new Map<string, number>();
  let total = 0;
  let readings = 0;

  for (const x of measurements) {
    if (!pick(x.buildingId)) continue;
    const t = Date.parse(x.timestamp);
    if (t < fromMs || t >= toMs) continue;
    total += x.kwh;
    readings++;
    const d = Math.floor(t / DAY) * DAY;
    byDay.set(d, (byDay.get(d) ?? 0) + x.kwh);
    byBuilding.set(x.buildingId, (byBuilding.get(x.buildingId) ?? 0) + x.kwh);
    const cur = byMeter.get(x.meterId) ?? { meterId: x.meterId, buildingId: x.buildingId, kwh: 0 };
    cur.kwh += x.kwh;
    byMeter.set(x.meterId, cur);
  }

  const daily: { day: number; kwh: number }[] = [];
  for (let d = fromMs; d < toMs; d += DAY) daily.push({ day: d, kwh: round(byDay.get(d) ?? 0) });
  const maxDay = daily.reduce<{ day: number; kwh: number } | null>(
    (m, d) => (d.kwh > 0 && (!m || d.kwh > m.kwh) ? d : m),
    null
  );

  const stats = (await getBuildingStats(scope)).filter((b) => q.buildingId === "ALL" || b.id === q.buildingId);

  return {
    query: q,
    days,
    readings,
    total: round(total),
    avgDaily: round(total / days),
    maxDay,
    cost: total * TARIFF_PER_KWH,
    co2: total * CO2_KG_PER_KWH,
    daily,
    buildings: stats.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      surfaceM2: b.surfaceM2,
      meterCount: b.meterCount,
      kwh: Math.round(byBuilding.get(b.id) ?? 0),
    })),
    meters: [...byMeter.values()]
      .map((m) => ({ meterId: m.meterId, buildingName: name(m.buildingId), kwh: Math.round(m.kwh) }))
      .sort((a, b) => b.kwh - a.kwh),
    anomalies: anomalies
      .filter((a) => pick(a.buildingId) && Date.parse(a.timestamp) >= fromMs && Date.parse(a.timestamp) < toMs)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        meterId: a.meterId,
        buildingName: name(a.buildingId),
        kwh: a.kwh,
        expectedKwh: a.expectedKwh,
        method: a.method,
        severity: a.severity,
        status: a.status,
      })),
    recommendations: (await getRecommendations(scope)).filter(
      (r) => q.buildingId === "ALL" || r.buildingId === q.buildingId
    ),
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;
