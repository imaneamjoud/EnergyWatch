"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, Check, Coins, Download, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { QuickPeriod } from "@/components/common/QuickPeriod";
import { BuildingBarChart } from "@/components/charts/BuildingBarChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CURRENCY_CODE } from "@/lib/config";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getBuildings } from "@/services/energy";
import { getDataRange } from "@/services/monitoring";
import { getReportData, type ReportData, type ReportType } from "@/services/reports";
import type { Building } from "@/types";

const DAY_MS = 86400000;
const TYPES: ReportType[] = ["SUMMARY", "ANOMALIES", "FULL"];
const typeKey = {
  SUMMARY: "rep.type.SUMMARY",
  ANOMALIES: "rep.type.ANOMALIES",
  FULL: "rep.type.FULL",
} as const;
const typeDescKey = {
  SUMMARY: "rep.type.SUMMARY.desc",
  ANOMALIES: "rep.type.ANOMALIES.desc",
  FULL: "rep.type.FULL.desc",
} as const;
const PRESET_KEY = { 1: "mon.preset.1", 3: "mon.preset.3", 7: "mon.preset.7" } as const;
const PRESET_DAYS = [1, 3, 7] as const;
const control =
  "h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [range, setRange] = useState<{ min: string; max: string } | null>(null);
  const [buildingId, setBuildingId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<ReportType>("FULL");
  const [data, setData] = useState<ReportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getBuildings(user.buildingIds), getDataRange()]).then(([b, r]) => {
      setBuildings(b);
      setRange(r);
      setFrom(r.min);
      setTo(r.max);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !range || !from || !to) return;
    getReportData({ buildingId, from, to }, user.buildingIds).then(setData);
  }, [user, range, buildingId, from, to]);

  if (!range) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const clamp = (v: string) => (v < range.min ? range.min : v > range.max ? range.max : v);
  const presetFrom = (n: number) =>
    clamp(new Date(Date.parse(`${range.max}T00:00:00Z`) - (n - 1) * DAY_MS).toISOString().slice(0, 10));
  const presets = PRESET_DAYS.map((n) => ({ days: n, label: t(PRESET_KEY[n]), from: presetFrom(n) }));

  const onFrom = (v: string) => {
    if (!v) return;
    const c = clamp(v);
    setFrom(c);
    if (c > to) setTo(c);
  };
  const onTo = (v: string) => {
    if (!v) return;
    const c = clamp(v);
    setTo(c);
    if (c < from) setFrom(c);
  };

  const buildingLabel =
    buildingId === "ALL" ? t("mon.allBuildings") : (buildings.find((b) => b.id === buildingId)?.name ?? buildingId);

  const download = async () => {
    if (!data) return;
    setGenerating(true);
    setFailed(false);
    try {
      const { generateReportPdf } = await import("@/lib/reportPdf");
      generateReportPdf({
        data,
        type,
        buildingLabel,
        t,
        locale,
        filename: `energyinsight_${type.toLowerCase()}_${buildingId}_${from}_${to}.pdf`,
      });
    } catch {
      setFailed(true);
    } finally {
      setGenerating(false);
    }
  };

  const contents: { label: string; on: boolean }[] = data
    ? [
        { label: t("rep.content.info"), on: true },
        { label: t("rep.content.totals"), on: true },
        { label: t("rep.content.daily"), on: type !== "ANOMALIES" },
        { label: fill(t("rep.content.meters"), { n: data.meters.length }), on: type === "FULL" },
        { label: fill(t("rep.content.anomalies"), { n: data.anomalies.length }), on: type !== "SUMMARY" },
        { label: fill(t("rep.content.recos"), { n: data.recommendations.length }), on: type !== "SUMMARY" },
      ]
    : [];

  return (
    <div className="ei-page">
      <PageHeader titleKey="page.reports.title" descKey="page.reports.desc" />

      <section className="ei-panel">
        <div className="ei-fields">
          <div className="ei-group">
            <label htmlFor="rep-building" className="ei-label">{t("mon.building")}</label>
            <select id="rep-building" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={control}>
              <option value="ALL">{t("mon.allBuildings")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="ei-group">
            <label htmlFor="rep-from" className="ei-label">{t("mon.from")}</label>
            <Input id="rep-from" type="date" min={range.min} max={range.max} value={from} onChange={(e) => onFrom(e.target.value)} className="h-10 w-full min-w-0" />
          </div>
          <div className="ei-group">
            <label htmlFor="rep-to" className="ei-label">{t("mon.to")}</label>
            <Input id="rep-to" type="date" min={range.min} max={range.max} value={to} onChange={(e) => onTo(e.target.value)} className="h-10 w-full min-w-0" />
          </div>
        </div>

        <div className="ei-block">
          <QuickPeriod
            presets={presets}
            from={from}
            to={to}
            max={range.max}
            onSelect={(f) => {
              setFrom(f);
              setTo(range.max);
            }}
          />
        </div>

        <div className="ei-block">
          <span className="ei-label">{t("rep.type")}</span>
          <div className="ei-types">
            {TYPES.map((tp) => (
              <button key={tp} type="button" aria-pressed={type === tp} onClick={() => setType(tp)} className="ei-type">
                <span className="ei-type-title">{t(typeKey[tp])}</span>
                <span className="ei-type-desc">{t(typeDescKey[tp])}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {!data ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <h3 className="text-lg font-semibold">{t("rep.preview")}</h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={t("mon.kpi.total")} value={Math.round(data.total)} unit="kWh" icon={Zap} tone="emerald" />
            <KpiCard label={t("mon.kpi.avgDaily")} value={Math.round(data.avgDaily)} unit="kWh" icon={Activity} tone="sky" hint={fill(t("mon.daysHint"), { n: data.days })} />
            <KpiCard
              label={t("rep.kpi.cost")}
              value={data.cost.toLocaleString(locale, { style: "currency", currency: CURRENCY_CODE, maximumFractionDigits: 0 })}
              icon={Coins}
              tone="amber"
            />
            <KpiCard label={t("rep.kpi.co2")} value={Math.round(data.co2)} unit="kg" icon={Zap} tone="rose" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("rep.chart")}</CardTitle>
              </CardHeader>
              <CardContent>
                <BuildingBarChart
                  data={data.daily.map((d) => ({ name: new Date(d.day).toISOString().slice(5, 10), kwh: d.kwh }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("rep.contents")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {contents.map((c) => (
                    <li key={c.label} className={cn("flex items-center gap-2", !c.on && "text-muted-foreground line-through opacity-60")}>
                      <Check className={cn("h-4 w-4 shrink-0", c.on ? "text-emerald-500" : "opacity-0")} />
                      {c.label}
                    </li>
                  ))}
                </ul>

                {failed && (
                  <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {t("rep.error")}
                  </div>
                )}

                <Button onClick={download} disabled={generating} className="grad-emerald w-full border-0 text-white hover:opacity-90">
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("rep.generating")}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t("rep.download")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
