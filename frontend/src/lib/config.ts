// Paramètres modifiables depuis la page Settings.
// Un "export let" est une liaison dynamique : les fichiers qui l'importent voient la nouvelle valeur.
export let TARIFF_PER_KWH = 0.15;
export let CURRENCY_CODE = "EUR";
export let CO2_KG_PER_KWH = 0.4;
export let PERIOD_TARGET_KWH_PER_METER = 155;
export let SILENT_AFTER_HOURS = 6;
export let Z_THRESHOLD = 3;
export let IQR_FACTOR = 1.5;
export let NIGHT_RATIO_PCT = 50;
export let RISING_PCT = 10;

export interface RuntimeSettings {
  tariffPerKwh: number;
  currency: string;
  co2KgPerKwh: number;
  targetKwhPerMeter: number;
  silentAfterHours: number;
  zThreshold: number;
  iqrFactor: number;
  nightRatioPct: number;
  risingPct: number;
}

export const DEFAULT_SETTINGS: RuntimeSettings = {
  tariffPerKwh: 0.15,
  currency: "EUR",
  co2KgPerKwh: 0.4,
  targetKwhPerMeter: 155,
  silentAfterHours: 6,
  zThreshold: 3,
  iqrFactor: 1.5,
  nightRatioPct: 50,
  risingPct: 10,
};

export function getRuntimeSettings(): RuntimeSettings {
  return {
    tariffPerKwh: TARIFF_PER_KWH,
    currency: CURRENCY_CODE,
    co2KgPerKwh: CO2_KG_PER_KWH,
    targetKwhPerMeter: PERIOD_TARGET_KWH_PER_METER,
    silentAfterHours: SILENT_AFTER_HOURS,
    zThreshold: Z_THRESHOLD,
    iqrFactor: IQR_FACTOR,
    nightRatioPct: NIGHT_RATIO_PCT,
    risingPct: RISING_PCT,
  };
}

export function applySettings(s: RuntimeSettings) {
  TARIFF_PER_KWH = s.tariffPerKwh;
  CURRENCY_CODE = s.currency;
  CO2_KG_PER_KWH = s.co2KgPerKwh;
  PERIOD_TARGET_KWH_PER_METER = s.targetKwhPerMeter;
  SILENT_AFTER_HOURS = s.silentAfterHours;
  Z_THRESHOLD = s.zThreshold;
  IQR_FACTOR = s.iqrFactor;
  NIGHT_RATIO_PCT = s.nightRatioPct;
  RISING_PCT = s.risingPct;
}

export const BUILDING_COLORS: Record<string, string> = {
  b1: "#10b981",
  b2: "#0ea5e9",
  b3: "#f59e0b",
  b4: "#8b5cf6",
  b5: "#f43f5e",
};
export const FALLBACK_COLOR = "#64748b";
