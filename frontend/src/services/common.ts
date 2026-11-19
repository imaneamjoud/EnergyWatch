import { measurements } from "@/mocks/data";

export const HOUR = 3600000;
export const DAY = 24 * HOUR;

// Les données fictives se terminent à cet instant : il sert de "maintenant"
export const REF = Date.parse(measurements[measurements.length - 1].timestamp);
// Première heure des données fictives
export const FIRST = Date.parse(measurements[0].timestamp);

export const inScope = (id: string, scope?: string[]) =>
  !scope || scope.length === 0 || scope.includes(id);

export const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// Heures ouvrées du simulateur : lundi à vendredi, 08:00 à 18:00 (UTC)
export function isBusinessHour(ts: number) {
  const d = new Date(ts);
  const dow = d.getUTCDay();
  const h = d.getUTCHours();
  return dow !== 0 && dow !== 6 && h >= 8 && h < 18;
}

// Dernière mesure reçue par compteur (horodatage en ms)
export function lastMeasurementByMeter(): Map<string, number> {
  const map = new Map<string, number>();
  for (const x of measurements) {
    const t = Date.parse(x.timestamp);
    if (t > (map.get(x.meterId) ?? 0)) map.set(x.meterId, t);
  }
  return map;
}
