import { fill } from "@/lib/format";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { Priority, RecoType } from "@/services/recommendations";

const KEYS: Record<RecoType, [TranslationKey, TranslationKey, TranslationKey]> = {
  SILENT_METER: ["reco.silent.title", "reco.silent.desc", "reco.silent.action"],
  OPEN_ANOMALIES: ["reco.anomalies.title", "reco.anomalies.desc", "reco.anomalies.action"],
  NIGHT_LOAD: ["reco.night.title", "reco.night.desc", "reco.night.action"],
  RISING: ["reco.rising.title", "reco.rising.desc", "reco.rising.action"],
  STABLE: ["reco.stable.title", "reco.stable.desc", "reco.stable.action"],
};

export function recoText(
  r: { type: RecoType; params: Record<string, string | number> },
  t: (key: TranslationKey) => string
) {
  const [title, desc, action] = KEYS[r.type];
  return {
    title: fill(t(title), r.params),
    desc: fill(t(desc), r.params),
    action: fill(t(action), r.params),
  };
}

export const priorityKey = {
  HIGH: "reco.priority.HIGH",
  MEDIUM: "reco.priority.MEDIUM",
  LOW: "reco.priority.LOW",
  INFO: "reco.priority.INFO",
} as const;

export const priorityStyle: Record<Priority, string> = {
  HIGH: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  MEDIUM: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  LOW: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  INFO: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};
