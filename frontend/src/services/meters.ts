import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import type { TranslationKey } from "@/i18n/dictionaries";
import { SILENT_AFTER_HOURS } from "@/lib/config";
import type { Result } from "@/services/buildings";
import { HOUR, REF, inScope, round } from "@/services/common";
import type { Period } from "@/services/dashboard";
import type { Meter, MeterStatus } from "@/types";

export interface MeterInput {
  buildingId: string;
  location: string;
  status: MeterStatus;
}

export interface MeterRow {
  id: string;
  buildingId: string;
  buildingName: string;
  location: string;
  status: MeterStatus;
  installedAt: string;
  online: boolean;
  lastTs: string | null;
  lastKwh: number | null;
  kwh7d: number;
  anomalyCount: number;
  openAnomalies: number;
}

interface Details {
  location: string;
  installedAt: string;
}
interface Agg {
  kwh7d: number;
  last: number;
  lastKwh: number;
}

// Informations complémentaires des compteurs (données fictives)
const details = new Map<string, Details>(
  meters.map((m): [string, Details] => {
    const n = Number(m.id.slice(1));
    return [
      m.id,
      {
        location: `Zone ${"ABCDEF"[(n - 1) % 6]}`,
        installedAt: `2024-${String((n % 9) + 1).padStart(2, "0")}-15`,
      },
    ];
  })
);

const WINDOW: Record<Period, number> = { "24h": 24, "3d": 72, "7d": 168 };

function aggregate() {
  const map = new Map<string, Agg>();
  for (const x of measurements) {
    const t = Date.parse(x.timestamp);
    const cur = map.get(x.meterId) ?? { kwh7d: 0, last: 0, lastKwh: 0 };
    cur.kwh7d += x.kwh;
    if (t >= cur.last) {
      cur.last = t;
      cur.lastKwh = x.kwh;
    }
    map.set(x.meterId, cur);
  }
  return map;
}

function toRow(m: Meter, s?: Agg): MeterRow {
  const d = details.get(m.id) ?? { location: "", installedAt: "2026-01-01" };
  const own = anomalies.filter((a) => a.meterId === m.id);
  const last = s?.last ?? 0;
  return {
    id: m.id,
    buildingId: m.buildingId,
    buildingName: buildings.find((b) => b.id === m.buildingId)?.name ?? m.buildingId,
    location: d.location,
    status: m.status,
    installedAt: d.installedAt,
    online: last > 0 && REF - last <= SILENT_AFTER_HOURS * HOUR,
    lastTs: last > 0 ? new Date(last).toISOString() : null,
    lastKwh: s && last > 0 ? s.lastKwh : null,
    kwh7d: round(s?.kwh7d ?? 0),
    anomalyCount: own.length,
    openAnomalies: own.filter((a) => a.status !== "RESOLVED").length,
  };
}

function validate(input: MeterInput): TranslationKey | null {
  if (!buildings.some((b) => b.id === input.buildingId)) return "meters.err.building";
  return null;
}

export async function getMeterRows(scope?: string[]): Promise<MeterRow[]> {
  const agg = aggregate();
  return meters.filter((m) => inScope(m.buildingId, scope)).map((m) => toRow(m, agg.get(m.id)));
}

export async function getMeterDetail(id: string, scope?: string[]) {
  const m = meters.find((x) => x.id === id);
  if (!m || !inScope(m.buildingId, scope)) return null;

  const rows = measurements.filter((x) => x.meterId === id);
  let kwh24h = 0;
  let kwh7d = 0;
  let peak = { kwh: 0, ts: 0 };
  for (const x of rows) {
    const t = Date.parse(x.timestamp);
    kwh7d += x.kwh;
    if (t > REF - 24 * HOUR) kwh24h += x.kwh;
    if (x.kwh > peak.kwh) peak = { kwh: x.kwh, ts: t };
  }

  return {
    row: toRow(m, aggregate().get(id)),
    kwh24h: round(kwh24h),
    kwh7d: round(kwh7d),
    avgHourly: rows.length ? round(kwh7d / rows.length, 2) : 0,
    peak: peak.ts ? { kwh: peak.kwh, ts: new Date(peak.ts).toISOString() } : null,
    latest: rows.slice(-12).reverse(),
    anomalies: anomalies
      .filter((a) => a.meterId === id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  };
}

export async function getMeterSeries(id: string, period: Period) {
  const from = REF - WINDOW[period] * HOUR;
  const data = measurements
    .filter((x) => x.meterId === id && Date.parse(x.timestamp) > from)
    .map((x) => ({ ts: Date.parse(x.timestamp), kwh: x.kwh }));
  const present = new Set(data.map((d) => d.ts));
  const marks = anomalies
    .filter((a) => a.meterId === id)
    .map((a) => ({ ts: Date.parse(a.timestamp), kwh: a.kwh }))
    .filter((a) => present.has(a.ts));
  return { data, anomalies: marks };
}

export async function createMeter(input: MeterInput): Promise<Result<{ id: string }>> {
  const error = validate(input);
  if (error) return { ok: false, error };
  const next = meters.reduce((mx, m) => Math.max(mx, Number(m.id.slice(1)) || 0), 0) + 1;
  const id = `C${String(next).padStart(3, "0")}`;
  meters.push({ id, buildingId: input.buildingId, status: input.status });
  details.set(id, {
    location: input.location.trim(),
    installedAt: new Date().toISOString().slice(0, 10),
  });
  return { ok: true, data: { id } };
}

export async function updateMeter(id: string, input: MeterInput): Promise<Result<{ id: string }>> {
  const m = meters.find((x) => x.id === id);
  if (!m) return { ok: false, error: "meters.err.notFound" };
  const error = validate(input);
  if (error) return { ok: false, error };

  if (m.buildingId !== input.buildingId) {
    // Démo : l'historique suit le compteur (avec Cassandra, il faudrait réécrire les partitions)
    for (const x of measurements) if (x.meterId === id) x.buildingId = input.buildingId;
    for (const a of anomalies) if (a.meterId === id) a.buildingId = input.buildingId;
  }
  m.buildingId = input.buildingId;
  m.status = input.status;
  details.set(id, {
    location: input.location.trim(),
    installedAt: details.get(id)?.installedAt ?? "2026-01-01",
  });
  return { ok: true, data: { id } };
}
