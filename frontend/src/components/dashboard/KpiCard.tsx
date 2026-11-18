"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/context/LanguageContext";

type Tone = "emerald" | "sky" | "amber" | "rose";

const gradient: Record<Tone, string> = {
  emerald: "grad-emerald shadow-emerald-500/30",
  sky: "grad-sky shadow-sky-500/30",
  amber: "grad-amber shadow-amber-500/30",
  rose: "grad-rose shadow-rose-500/30",
};
const tint: Record<Tone, string> = {
  emerald: "tint-emerald",
  sky: "tint-sky",
  amber: "tint-amber",
  rose: "tint-rose",
};
const bar: Record<Tone, string> = {
  emerald: "grad-emerald",
  sky: "grad-sky",
  amber: "grad-amber",
  rose: "grad-rose",
};
const textTone: Record<Tone, string> = {
  emerald: "text-emerald-500",
  sky: "text-sky-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
};

function Sparkline({ data }: { data: number[] }) {
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - ((v - min) / range) * (h - 4)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "emerald",
  trend,
  trendLabel,
  goodWhenDown = true,
  spark,
  hint,
  progress,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  tone?: Tone;
  trend?: number;
  trendLabel?: string;
  goodWhenDown?: boolean;
  spark?: number[];
  hint?: string;
  progress?: number;
}) {
  const { locale } = useI18n();
  const up = (trend ?? 0) > 0;
  const good = goodWhenDown ? !up : up;
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={`${tint[tone]} overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-lg`}>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString(locale) : value}
              {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
            </p>
          </div>
          <div className={`${gradient[tone]} flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${
                good ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              <TrendIcon className="h-3 w-3" />
              {up ? "+" : ""}
              {trend.toLocaleString(locale, { maximumFractionDigits: 1 })} %
            </span>
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </div>
        )}

        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

        {spark && spark.length > 1 && (
          <div className={textTone[tone]}>
            <Sparkline data={spark} />
          </div>
        )}

        {progress !== undefined && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`${bar[tone]} h-full rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
