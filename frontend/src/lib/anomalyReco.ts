import type { TranslationKey } from "@/i18n/dictionaries";
import type { AnomalyStatus, Severity } from "@/types";

export const severityKey = {
  LOW: "severity.LOW",
  MEDIUM: "severity.MEDIUM",
  HIGH: "severity.HIGH",
} as const;

export const anomalyStatusKey = {
  NEW: "status.NEW",
  IN_PROGRESS: "status.IN_PROGRESS",
  RESOLVED: "status.RESOLVED",
} as const;

export const statusStyle: Record<AnomalyStatus, string> = {
  NEW: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  IN_PROGRESS: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  RESOLVED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export const severityStyle: Record<Severity, string> = {
  HIGH: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  MEDIUM: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  LOW: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

export function anomalyRecoKey(a: { offHours: boolean; severity: Severity }): TranslationKey {
  if (a.offHours) return "anom.reco.offHours";
  return a.severity === "HIGH" ? "anom.reco.urgent" : "anom.reco.generic";
}
