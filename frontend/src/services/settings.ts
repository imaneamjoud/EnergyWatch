import {
  DEFAULT_SETTINGS, applySettings, getRuntimeSettings, type RuntimeSettings,
} from "@/lib/config";
import type { Result } from "@/services/buildings";

const CURRENCIES = ["EUR", "MAD", "USD"];

export async function getSettings(): Promise<RuntimeSettings> {
  return getRuntimeSettings();
}

function isValid(s: RuntimeSettings) {
  const numbersOk = Object.values(s).every((v) => typeof v === "string" || Number.isFinite(v));
  return (
    numbersOk &&
    s.tariffPerKwh >= 0 &&
    s.co2KgPerKwh >= 0 &&
    s.targetKwhPerMeter > 0 &&
    Number.isInteger(s.silentAfterHours) && s.silentAfterHours >= 1 && s.silentAfterHours <= 72 &&
    s.zThreshold >= 1 && s.zThreshold <= 10 &&
    s.iqrFactor >= 0.5 && s.iqrFactor <= 5 &&
    s.nightRatioPct >= 10 && s.nightRatioPct <= 100 &&
    s.risingPct >= 1 && s.risingPct <= 100 &&
    CURRENCIES.includes(s.currency)
  );
}

export async function saveSettings(s: RuntimeSettings): Promise<Result<RuntimeSettings>> {
  if (!isValid(s)) return { ok: false, error: "set.err.invalid" };
  applySettings(s);
  return { ok: true, data: getRuntimeSettings() };
}

export async function resetSettings(): Promise<RuntimeSettings> {
  applySettings(DEFAULT_SETTINGS);
  return getRuntimeSettings();
}
