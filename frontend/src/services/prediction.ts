import { measurements } from "@/mocks/data";
import { TARIFF_PER_KWH } from "@/lib/config";
import { DAY, HOUR, REF, inScope, round } from "@/services/common";

const isWeekend = (ts: number) => [0, 6].includes(new Date(ts).getUTCDay());
const keyOf = (ts: number) => `${isWeekend(ts) ? "WE" : "WD"}-${new Date(ts).getUTCHours()}`;

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  if (s.length === 0) return 0;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Modèle de référence : profil horaire médian par type de jour (jour ouvré / week-end)
function buildModel(entries: [number, number][]) {
  const buckets = new Map<string, number[]>();
  let sum = 0;
  for (const [ts, v] of entries) {
    sum += v;
    const k = keyOf(ts);
    const arr = buckets.get(k);
    if (arr) arr.push(v);
    else buckets.set(k, [v]);
  }
  const fallback = entries.length ? sum / entries.length : 0;
  const profile = new Map<string, number>();
  for (const [k, vals] of buckets) profile.set(k, median(vals));
  return (ts: number) => profile.get(keyOf(ts)) ?? fallback;
}

function hourlySeries(buildingId: string, scope?: string[]): [number, number][] {
  const map = new Map<number, number>();
  for (const m of measurements) {
    if (!inScope(m.buildingId, scope)) continue;
    if (buildingId !== "ALL" && m.buildingId !== buildingId) continue;
    const t = Date.parse(m.timestamp);
    map.set(t, (map.get(t) ?? 0) + m.kwh);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export async function getPrediction(buildingId: string, scope?: string[]) {
  const series = hourlySeries(buildingId, scope);
  const model = buildModel(series);
  const cutoff = REF - 48 * HOUR;
  const trainModel = buildModel(series.filter(([t]) => t <= cutoff));

  const history = series.map(([ts, v]) => ({ ts, actual: round(v, 2) }));
  const horizon = Array.from({ length: 168 }, (_, i) => {
    const ts = REF + (i + 1) * HOUR;
    return { ts, forecast: round(model(ts), 2) };
  });
  const backtest = series
    .filter(([t]) => t > cutoff)
    .map(([ts, v]) => ({ ts, actual: round(v, 2), forecast: round(trainModel(ts), 2) }));

  let pctSum = 0;
  let pctN = 0;
  for (const b of backtest) {
    if (b.actual > 0) {
      pctSum += Math.abs(b.actual - b.forecast) / b.actual;
      pctN++;
    }
  }

  const chart: { ts: number; actual?: number; forecast?: number }[] = [
    ...history.map((h, i) =>
      i === history.length - 1 ? { ts: h.ts, actual: h.actual, forecast: h.actual } : { ts: h.ts, actual: h.actual }
    ),
    ...horizon.map((f) => ({ ts: f.ts, forecast: f.forecast })),
  ];

  const byDay = new Map<number, number>();
  for (const f of horizon) {
    const d = Math.floor(f.ts / DAY) * DAY;
    byDay.set(d, (byDay.get(d) ?? 0) + f.forecast);
  }
  const daily = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, kwh]) => ({ day, kwh: round(kwh), cost: kwh * TARIFF_PER_KWH, weekend: isWeekend(day) }));

  const lastDay = history.filter((h) => h.ts > REF - 24 * HOUR).reduce((s, h) => s + h.actual, 0);
  const lastWeek = history.reduce((s, h) => s + h.actual, 0);
  const weekTotal = daily.reduce((s, d) => s + d.kwh, 0);
  const tomorrow = daily[0]?.kwh ?? 0;
  const peak = horizon
    .slice(0, 24)
    .reduce<{ ts: number; kwh: number } | null>(
      (m, h) => (!m || h.forecast > m.kwh ? { ts: h.ts, kwh: h.forecast } : m),
      null
    );

  return {
    hasData: series.length > 0,
    splitTs: REF,
    chart,
    backtest,
    daily,
    tomorrow: {
      kwh: tomorrow,
      trendPct: lastDay > 0 ? ((tomorrow - lastDay) / lastDay) * 100 : null,
      peak,
    },
    week: {
      kwh: Math.round(weekTotal),
      cost: weekTotal * TARIFF_PER_KWH,
      trendPct: lastWeek > 0 ? ((weekTotal - lastWeek) / lastWeek) * 100 : null,
    },
    mapePct: pctN ? (pctSum / pctN) * 100 : 0,
  };
}

export type PredictionData = Awaited<ReturnType<typeof getPrediction>>;
