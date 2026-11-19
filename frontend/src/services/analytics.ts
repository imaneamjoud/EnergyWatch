import { buildings, measurements, meters } from "@/mocks/data";
import { getBuildingStats } from "@/services/buildings";
import { DAY, inScope, isBusinessHour, round } from "@/services/common";

export async function getAnalytics(scope?: string[]) {
  const perB = new Map<string, Map<number, number>>();
  const offB = new Map<string, number>();
  const allHours = new Map<number, number>();
  const days = new Set<number>();

  for (const x of measurements) {
    if (!inScope(x.buildingId, scope)) continue;
    const t = Date.parse(x.timestamp);
    const h = perB.get(x.buildingId) ?? new Map<number, number>();
    h.set(t, (h.get(t) ?? 0) + x.kwh);
    perB.set(x.buildingId, h);
    allHours.set(t, (allHours.get(t) ?? 0) + x.kwh);
    days.add(Math.floor(t / DAY));
    if (!isBusinessHour(t)) offB.set(x.buildingId, (offB.get(x.buildingId) ?? 0) + x.kwh);
  }

  const stats = await getBuildingStats(scope);
  const intensity = new Map(stats.map((s) => [s.id, s.kwhPerM2] as const));

  const rows = buildings
    .filter((b) => inScope(b.id, scope))
    .map((b) => {
      const hourly = [...(perB.get(b.id)?.entries() ?? [])];
      const vals = hourly.map(([, v]) => v);
      const total = vals.reduce((s, v) => s + v, 0);
      const mean = vals.length ? total / vals.length : 0;
      const variance = vals.length ? vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length : 0;
      const peak = hourly.reduce<{ ts: number; kwh: number } | null>(
        (m, [ts, kwh]) => (!m || kwh > m.kwh ? { ts, kwh } : m),
        null
      );
      return {
        id: b.id,
        name: b.name,
        total,
        mean,
        std: Math.sqrt(variance),
        peak,
        off: offB.get(b.id) ?? 0,
        meterCount: meters.filter((m) => m.buildingId === b.id).length,
      };
    });

  const grand = rows.reduce((s, r) => s + r.total, 0);
  const offTotal = rows.reduce((s, r) => s + r.off, 0);
  const meterTotal = rows.reduce((s, r) => s + r.meterCount, 0);

  const buildingsOut = rows.map((r) => ({
    id: r.id,
    name: r.name,
    total: Math.round(r.total),
    share: grand > 0 ? (r.total / grand) * 100 : 0,
    meterCount: r.meterCount,
    perMeter: r.meterCount ? Math.round(r.total / r.meterCount) : 0,
    avgHourly: round(r.mean, 2),
    std: round(r.std, 2),
    peak: r.peak ? { kwh: round(r.peak.kwh, 1), ts: new Date(r.peak.ts).toISOString() } : null,
    offHoursPct: r.total > 0 ? (r.off / r.total) * 100 : 0,
    kwhPerM2: intensity.get(r.id) ?? 0,
  }));

  const top = buildingsOut.reduce<(typeof buildingsOut)[number] | null>(
    (m, b) => (!m || b.total > m.total ? b : m),
    null
  );
  const peakAll = [...allHours.entries()].reduce<{ ts: number; kwh: number } | null>(
    (m, [ts, kwh]) => (!m || kwh > m.kwh ? { ts, kwh } : m),
    null
  );

  // Profil horaire moyen : jours ouvrés (lun.-ven.) et week-end
  const prof = Array.from({ length: 24 }, () => ({ wd: 0, wdN: 0, we: 0, weN: 0 }));
  for (const [t, v] of allHours) {
    const d = new Date(t);
    const p = prof[d.getUTCHours()];
    if ([0, 6].includes(d.getUTCDay())) {
      p.we += v;
      p.weN++;
    } else {
      p.wd += v;
      p.wdN++;
    }
  }
  const profile = prof.map((p, hour) => ({
    hour,
    weekday: p.wdN ? round(p.wd / p.wdN, 1) : 0,
    weekend: p.weN ? round(p.we / p.weN, 1) : 0,
  }));

  return {
    buildings: buildingsOut,
    top,
    avgPerMeterDay: meterTotal && days.size ? round(grand / meterTotal / days.size, 1) : 0,
    offHoursPct: grand > 0 ? (offTotal / grand) * 100 : 0,
    peak: peakAll ? { kwh: round(peakAll.kwh, 1), ts: new Date(peakAll.ts).toISOString() } : null,
    profile,
  };
}
