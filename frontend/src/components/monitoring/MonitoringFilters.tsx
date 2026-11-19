"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { QuickPeriod } from "@/components/common/QuickPeriod";
import { useI18n } from "@/context/LanguageContext";
import type { Granularity } from "@/services/monitoring";
import type { Building, Meter } from "@/types";

const control =
  "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="ei-group">
      <label htmlFor={id} className="ei-label">
        {label}
      </label>
      {children}
    </div>
  );
}

export function MonitoringFilters({
  buildings,
  meterOptions,
  range,
  buildingId,
  meterId,
  from,
  to,
  granularity,
  presets,
  onBuilding,
  onMeter,
  onFrom,
  onTo,
  onPreset,
  onGranularity,
}: {
  buildings: Building[];
  meterOptions: Meter[];
  range: { min: string; max: string };
  buildingId: string;
  meterId: string;
  from: string;
  to: string;
  granularity: Granularity;
  presets: { days: number; label: string; from: string }[];
  onBuilding: (v: string) => void;
  onMeter: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onPreset: (from: string) => void;
  onGranularity: (g: Granularity) => void;
}) {
  const { t } = useI18n();

  return (
    <section className="ei-panel">
      <div className="ei-fields">
        <Field id="mon-building" label={t("mon.building")}>
          <select id="mon-building" value={buildingId} onChange={(e) => onBuilding(e.target.value)} className={control}>
            <option value="ALL">{t("mon.allBuildings")}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="mon-meter" label={t("mon.meter")}>
          <select id="mon-meter" value={meterId} onChange={(e) => onMeter(e.target.value)} className={control}>
            <option value="ALL">{t("mon.allMeters")}</option>
            {meterOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
        </Field>

        <Field id="mon-from" label={t("mon.from")}>
          <Input id="mon-from" type="date" min={range.min} max={range.max} value={from} onChange={(e) => onFrom(e.target.value)} className="h-10 w-full min-w-0" />
        </Field>

        <Field id="mon-to" label={t("mon.to")}>
          <Input id="mon-to" type="date" min={range.min} max={range.max} value={to} onChange={(e) => onTo(e.target.value)} className="h-10 w-full min-w-0" />
        </Field>
      </div>

      <div className="ei-block">
        <div className="ei-filter-row">
          <QuickPeriod presets={presets} from={from} to={to} max={range.max} onSelect={onPreset} />

          <div className="ei-group">
            <span className="ei-label">{t("mon.granularity")}</span>
            <div className="ei-seg">
              {(["day", "hour"] as const).map((g) => (
                <button key={g} type="button" aria-pressed={granularity === g} onClick={() => onGranularity(g)}>
                  {g === "day" ? t("mon.day") : t("mon.hour")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
