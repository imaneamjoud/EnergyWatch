import { anomalies, buildings, measurements, meters } from "@/mocks/data";
import { Anomaly, Building, Measurement, Meter } from "@/types";

// buildingIds vide ou absent = tous les bâtiments
const inScope = (buildingId: string, scope?: string[]) =>
  !scope || scope.length === 0 || scope.includes(buildingId);

export async function getBuildings(scope?: string[]): Promise<Building[]> {
  return buildings.filter((b) => inScope(b.id, scope));
}

export async function getMeters(scope?: string[]): Promise<Meter[]> {
  return meters.filter((m) => inScope(m.buildingId, scope));
}

export async function getAnomalies(scope?: string[]): Promise<Anomaly[]> {
  return anomalies
    .filter((a) => inScope(a.buildingId, scope))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getLatestMeasurements(n = 10, scope?: string[]): Promise<Measurement[]> {
  return measurements
    .filter((m) => inScope(m.buildingId, scope))
    .slice(-n)
    .reverse();
}

export async function getKpis(scope?: string[]) {
  const b = await getBuildings(scope);
  const m = await getMeters(scope);
  const a = await getAnomalies(scope);
  const lastTs = new Date(measurements[measurements.length - 1].timestamp).getTime();
  const cutoff = lastTs - 24 * 3600 * 1000;
  const kwh24h = measurements
    .filter((x) => inScope(x.buildingId, scope) && new Date(x.timestamp).getTime() > cutoff)
    .reduce((sum, x) => sum + x.kwh, 0);
  return {
    buildings: b.length,
    meters: m.length,
    kwh24h: Math.round(kwh24h),
    anomalies: a.length,
  };
}

// consommation totale par jour (pour la courbe)
export async function getDailyConsumption(scope?: string[]) {
  const byDay = new Map<string, number>();
  for (const x of measurements) {
    if (!inScope(x.buildingId, scope)) continue;
    const day = x.timestamp.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + x.kwh);
  }
  return [...byDay.entries()].map(([day, kwh]) => ({ day, kwh: Math.round(kwh) }));
}

// consommation totale par bâtiment (pour les barres)
export async function getConsumptionByBuilding(scope?: string[]) {
  return buildings
    .filter((b) => inScope(b.id, scope))
    .map((b) => ({
      name: b.name,
      kwh: Math.round(
        measurements.filter((x) => x.buildingId === b.id).reduce((s, x) => s + x.kwh, 0)
      ),
    }));
}
