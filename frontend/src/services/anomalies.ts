import { anomalies, buildings, measurements } from "@/mocks/data";
import { HOUR, inScope, isBusinessHour, round } from "@/services/common";
import type { Anomaly } from "@/types";

export interface AnomalyRow extends Anomaly {
  buildingName: string;
  deviationPct: number; // (mesuré - habituel) / habituel
  ratio: number; // mesuré / habituel
  offHours: boolean; // hors lundi-vendredi 8 h-18 h (UTC)
}

export async function getAnomalyRows(scope?: string[]): Promise<AnomalyRow[]> {
  return anomalies
    .filter((a) => inScope(a.buildingId, scope))
    .map((a) => ({
      ...a,
      buildingName: buildings.find((b) => b.id === a.buildingId)?.name ?? a.buildingId,
      deviationPct: a.expectedKwh > 0 ? round(((a.kwh - a.expectedKwh) / a.expectedKwh) * 100, 0) : 0,
      ratio: a.expectedKwh > 0 ? round(a.kwh / a.expectedKwh, 1) : 0,
      offHours: !isBusinessHour(Date.parse(a.timestamp)),
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// Courbe du compteur 24 h avant et après l'anomalie
export async function getAnomalyContext(a: Anomaly) {
  const t0 = Date.parse(a.timestamp);
  const data = measurements
    .filter((m) => m.meterId === a.meterId && Math.abs(Date.parse(m.timestamp) - t0) <= 24 * HOUR)
    .map((m) => ({ ts: Date.parse(m.timestamp), kwh: m.kwh }));
  return { data, marks: [{ ts: t0, kwh: a.kwh }] };
}
