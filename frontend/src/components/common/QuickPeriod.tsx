"use client";

import { CalendarRange } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";

export function QuickPeriod({
  presets,
  from,
  to,
  max,
  onSelect,
}: {
  presets: { days: number; label: string; from: string }[];
  from: string;
  to: string;
  max: string;
  onSelect: (from: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="ei-group">
      <span className="ei-label">{t("mon.quick")}</span>
      <div className="ei-pills">
        {presets.map((p) => (
          <button
            key={p.days}
            type="button"
            aria-pressed={from === p.from && to === max}
            onClick={() => onSelect(p.from)}
            className="ei-pill"
          >
            <CalendarRange size={16} aria-hidden="true" />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
