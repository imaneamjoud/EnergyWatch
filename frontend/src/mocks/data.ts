import { Anomaly, Building, Measurement, Meter } from "@/types";

export const buildings: Building[] = [
  { id: "b1", name: "Administration" },
  { id: "b2", name: "Laboratoire" },
  { id: "b3", name: "Production" },
  { id: "b4", name: "Stockage" },
  { id: "b5", name: "Informatique" },
];

// consommation de base (kWh par heure et par compteur)
const BASE_LOAD: Record<string, number> = {
  b1: 0.9, b2: 1.4, b3: 2.6, b4: 0.6, b5: 1.7,
};

const INACTIVE_METERS = [24, 29];

export const meters: Meter[] = buildings.flatMap((b, bi) =>
  Array.from({ length: 6 }, (_, i) => {
    const n = bi * 6 + i + 1;
    return {
      id: "C" + String(n).padStart(3, "0"),
      buildingId: b.id,
      status: INACTIVE_METERS.includes(n) ? "INACTIVE" : "ACTIVE",
    } as Meter;
  })
);

// générateur pseudo-aléatoire reproductible
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const START = Date.UTC(2026, 10, 8, 0, 0, 0); // 8 novembre 2026
const HOURS = 7 * 24;
const HOUR_MS = 3600 * 1000;

function profile(date: Date) {
  const h = date.getUTCHours();
  const weekend = [0, 6].includes(date.getUTCDay());
  if (weekend) return 0.4;
  return h >= 8 && h < 18 ? 1 : 0.45;
}

// anomalies injectées : compteur, index de l'heure, facteur multiplicatif
const INJECTED = [
  { meter: "C014", hour: 5 * 24 + 2, factor: 6, method: "Z-score" },
  { meter: "C008", hour: 4 * 24 + 14, factor: 4.5, method: "Z-score" },
  { meter: "C020", hour: 6 * 24 + 3, factor: 8, method: "IQR" },
  { meter: "C027", hour: 3 * 24 + 22, factor: 4, method: "IQR" },
  { meter: "C003", hour: 5 * 24 + 21, factor: 5, method: "Z-score" },
];

const rand = mulberry32(42);

export const measurements: Measurement[] = [];
export const anomalies: Anomaly[] = [];

for (let h = 0; h < HOURS; h++) {
  const date = new Date(START + h * HOUR_MS);
  for (const m of meters) {
    // un compteur inactif ne transmet plus pendant les 48 dernières heures
    if (m.status === "INACTIVE" && h >= HOURS - 48) continue;

    const expected = BASE_LOAD[m.buildingId] * profile(date);
    const noise = 0.9 + rand() * 0.2;
    let kwh = expected * noise;

    const inj = INJECTED.find((a) => a.meter === m.id && a.hour === h);
    if (inj) {
      kwh = expected * inj.factor;
      anomalies.push({
        id: "A" + String(anomalies.length + 1).padStart(3, "0"),
        meterId: m.id,
        buildingId: m.buildingId,
        timestamp: date.toISOString(),
        kwh: Math.round(kwh * 100) / 100,
        expectedKwh: Math.round(expected * 100) / 100,
        method: inj.method,
        severity: inj.factor >= 6 ? "HIGH" : inj.factor >= 4.5 ? "MEDIUM" : "LOW",
        status: anomalies.length % 3 === 0 ? "NEW" : anomalies.length % 3 === 1 ? "IN_PROGRESS" : "RESOLVED",
        recommendation: "Vérifier les équipements raccordés à ce compteur à cette heure.",
      });
    }

    measurements.push({
      meterId: m.id,
      buildingId: m.buildingId,
      timestamp: date.toISOString(),
      kwh: Math.round(kwh * 100) / 100,
    });
  }
}
