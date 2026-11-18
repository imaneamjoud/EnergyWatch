import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { Anomaly, Building, BuildingInfo, BuildingType, Meter } from "@/types";

type Details = Omit<BuildingInfo, "id" | "name">;

export interface BuildingInput {
  name: string;
  type: BuildingType;
  address: string;
  surfaceM2: number;
  floors: number;
}

export interface BuildingStats extends BuildingInfo {
  meterCount: number;
  activeMeters: number;
  inactiveMeters: number;
  kwh7d: number;
  kwh24h: number;
  kwhPerM2: number;
  openAnomalies: number;
  lastMeasurementTs: string | null;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: TranslationKey };

// Informations complémentaires des bâtiments (données fictives)
const details = new Map<string, Details>([
  ["b1", { type: "OFFICE", address: "Campus EnergyInsight, Bloc A", surfaceM2: 3200, floors: 4, createdAt: "2024-03-12" }],
  ["b2", { type: "LAB", address: "Campus EnergyInsight, Bloc B", surfaceM2: 1800, floors: 2, createdAt: "2024-03-12" }],
  ["b3", { type: "INDUSTRIAL", address: "Zone de production, Hall 1", surfaceM2: 5200, floors: 1, createdAt: "2024-05-02" }],
  ["b4", { type: "WAREHOUSE", address: "Zone de production, Hall 3", surfaceM2: 2600, floors: 1, createdAt: "2024-06-18" }],
  ["b5", { type: "DATA_CENTER", address: "Campus EnergyInsight, Bloc D", surfaceM2: 950, floors: 2, createdAt: "2024-09-30" }],
]);

const FALLBACK: Details = { type: "OFFICE", address: "", surfaceM2: 1, floors: 1, createdAt: "2026-01-01" };

const HOUR = 3600000;
// Les données fictives se terminent à cet instant : il sert de "maintenant"
const REF = new Date(measurements[measurements.length - 1].timestamp).getTime();

const inScope = (id: string, scope?: string[]) => !scope || scope.length === 0 || scope.includes(id);
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

function computeStats(b: Building): BuildingStats {
  const d = details.get(b.id) ?? FALLBACK;
  const ms = meters.filter((m) => m.buildingId === b.id);
  let kwh7d = 0;
  let kwh24h = 0;
  let last = 0;
  for (const x of measurements) {
    if (x.buildingId !== b.id) continue;
    kwh7d += x.kwh;
    const t = Date.parse(x.timestamp);
    if (t > REF - 24 * HOUR) kwh24h += x.kwh;
    if (t > last) last = t;
  }
  const active = ms.filter((m) => m.status === "ACTIVE").length;
  return {
    id: b.id,
    name: b.name,
    ...d,
    meterCount: ms.length,
    activeMeters: active,
    inactiveMeters: ms.length - active,
    kwh7d: round(kwh7d),
    kwh24h: round(kwh24h),
    kwhPerM2: d.surfaceM2 > 0 ? round(kwh7d / d.surfaceM2, 3) : 0,
    openAnomalies: anomalies.filter((a) => a.buildingId === b.id && a.status !== "RESOLVED").length,
    lastMeasurementTs: last ? new Date(last).toISOString() : null,
  };
}

function validate(input: BuildingInput, excludeId?: string): TranslationKey | null {
  const name = input.name.trim();
  if (!name) return "buildings.err.nameRequired";
  if (buildings.some((b) => b.id !== excludeId && b.name.toLowerCase() === name.toLowerCase())) {
    return "buildings.err.nameExists";
  }
  if (!Number.isFinite(input.surfaceM2) || input.surfaceM2 <= 0) return "buildings.err.surface";
  if (!Number.isInteger(input.floors) || input.floors < 1) return "buildings.err.floors";
  return null;
}

export async function getBuildingStats(scope?: string[]): Promise<BuildingStats[]> {
  return buildings.filter((b) => inScope(b.id, scope)).map(computeStats);
}

export async function getBuildingDetail(id: string, scope?: string[]) {
  const b = buildings.find((x) => x.id === id);
  if (!b || !inScope(b.id, scope)) return null;

  const perMeter = new Map<string, { kwh7d: number; last: number }>();
  const byDay = new Map<string, number>();
  for (const x of measurements) {
    if (x.buildingId !== id) continue;
    const t = Date.parse(x.timestamp);
    const cur = perMeter.get(x.meterId) ?? { kwh7d: 0, last: 0 };
    cur.kwh7d += x.kwh;
    if (t > cur.last) cur.last = t;
    perMeter.set(x.meterId, cur);
    const day = x.timestamp.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + x.kwh);
  }

  const meterRows = meters
    .filter((m) => m.buildingId === id)
    .map((m) => {
      const p = perMeter.get(m.id);
      return {
        meter: m as Meter,
        kwh7d: round(p?.kwh7d ?? 0),
        lastTs: p && p.last ? new Date(p.last).toISOString() : null,
      };
    });

  const daily = [...byDay.entries()]
    .sort((a, b2) => a[0].localeCompare(b2[0]))
    .map(([day, kwh]) => ({ day, kwh: Math.round(kwh) }));

  const buildingAnomalies: Anomaly[] = anomalies
    .filter((a) => a.buildingId === id)
    .sort((a, b2) => b2.timestamp.localeCompare(a.timestamp));

  return { stats: computeStats(b), meters: meterRows, daily, anomalies: buildingAnomalies };
}

export async function createBuilding(input: BuildingInput): Promise<Result<{ id: string }>> {
  const error = validate(input);
  if (error) return { ok: false, error };
  const next = buildings.reduce((mx, b) => Math.max(mx, Number(b.id.slice(1)) || 0), 0) + 1;
  const id = `b${next}`;
  buildings.push({ id, name: input.name.trim() });
  details.set(id, {
    type: input.type,
    address: input.address.trim(),
    surfaceM2: input.surfaceM2,
    floors: input.floors,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  return { ok: true, data: { id } };
}

export async function updateBuilding(id: string, input: BuildingInput): Promise<Result<{ id: string }>> {
  const b = buildings.find((x) => x.id === id);
  if (!b) return { ok: false, error: "buildings.err.notFound" };
  const error = validate(input, id);
  if (error) return { ok: false, error };
  b.name = input.name.trim();
  const prev = details.get(id) ?? FALLBACK;
  details.set(id, {
    ...prev,
    type: input.type,
    address: input.address.trim(),
    surfaceM2: input.surfaceM2,
    floors: input.floors,
  });
  return { ok: true, data: { id } };
}

export async function deleteBuilding(id: string): Promise<Result<{ id: string }>> {
  const index = buildings.findIndex((x) => x.id === id);
  if (index < 0) return { ok: false, error: "buildings.err.notFound" };
  if (meters.some((m) => m.buildingId === id)) return { ok: false, error: "buildings.err.hasMeters" };
  buildings.splice(index, 1);
  details.delete(id);
  return { ok: true, data: { id } };
}
