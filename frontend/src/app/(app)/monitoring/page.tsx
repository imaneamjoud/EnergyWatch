"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, Clock, Download, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getBuildings, getMeters } from "@/services/energy";
import { getDataRange, getMonitoring, type Granularity } from "@/services/monitoring";
import type { Building, Meter } from "@/types";

type MonResult = Awaited<ReturnType<typeof getMonitoring>>;

const DAY_MS = 86400000;
const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const PRESETS = [
  { days: 1, key: "mon.preset.1" },
  { days: 3, key: "mon.preset.3" },
  { days: 7, key: "mon.preset.7" },
] as const;

export default function MonitoringPage() {
  const { user } = useAuth();
  const { t, lang, locale } = useI18n();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [range, setRange] = useState<{ min: string; max: string } | null>(null);
  const [buildingId, setBuildingId] = useState("ALL");
  const [meterId, setMeterId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [result, setResult] = useState<MonResult | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getBuildings(user.buildingIds), getMeters(user.buildingIds), getDataRange()]).then(([b, m, r]) => {
      setBuildings(b);
      setMeters(m);
      setRange(r);
      setFrom(r.min);
      setTo(r.max);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !range || !from || !to) return;
    getMonitoring({ buildingId, meterId, from, to, granularity }, user.buildingIds).then(setResult);
  }, [user, range, buildingId, meterId, from, to, granularity]);

  if (!range) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const clamp = (v: string) => (v < range.min ? range.min : v > range.max ? range.max : v);
  const presetFrom = (n: number) =>
    clamp(new Date(Date.parse(`${range.max}T00:00:00Z`) - (n - 1) * DAY_MS).toISOString().slice(0, 10));

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

  const meterOptions = meters.filter((m) => buildingId === "ALL" || m.buildingId === buildingId);

  const dayLabel = (ms: number) =>
    new Date(ms).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const fmtTs = (ms: number) =>
    new Date(ms).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });
  const formatTick = (ts: number) =>
    granularity === "hour"
      ? new Date(ts).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
      : new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" });

  const num = (n: number) => (lang === "fr" ? n.toFixed(2).replace(".", ",") : n.toFixed(2));

  const exportCsv = () => {
    if (!result) return;
    const rows: (string | number)[][] = [[t("mon.table.day"), "kWh", `${t("mon.table.share")} %`]];
    for (const d of result.daily) {
      const share = result.total > 0 ? (d.kwh / result.total) * 100 : 0;
      rows.push([new Date(d.day).toISOString().slice(0, 10), num(d.kwh), num(share)]);
    }
    downloadCsv(`energyinsight_${from}_${to}.csv`, rows);
  };

  const maxKwh = result ? Math.max(1, ...result.daily.map((d) => d.kwh)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader titleKey="page.monitoring.title" descKey="page.monitoring.desc" />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="mon-building">{t("mon.building")}</Label>
              <select
                id="mon-building"
                value={buildingId}
                onChange={(e) => {
                  setBuildingId(e.target.value);
                  setMeterId("ALL");
                }}
                className={selectClass}
              >
                <option value="ALL">{t("mon.allBuildings")}</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mon-meter">{t("mon.meter")}</Label>
              <select id="mon-meter" value={meterId} onChange={(e) => setMeterId(e.target.value)} className={selectClass}>
                <option value="ALL">{t("mon.allMeters")}</option>
                {meterOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mon-from">{t("mon.from")}</Label>
              <Input id="mon-from" type="date" min={range.min} max={range.max} value={from} onChange={(e) => onFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mon-to">{t("mon.to")}</Label>
              <Input id="mon-to" type="date" min={range.min} max={range.max} value={to} onChange={(e) => onTo(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t("mon.quick")}</span>
              {PRESETS.map((p) => {
                const active = from === presetFrom(p.days) && to === range.max;
                return (
                  <button
                    key={p.days}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFrom(presetFrom(p.days));
                      setTo(range.max);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                      active ? "grad-emerald border-transparent text-white shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(p.key)}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t("mon.granularity")}</span>
              <div className="flex items-center rounded-full border bg-muted p-0.5 text-xs font-semibold">
                {(["day", "hour"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={granularity === g}
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "rounded-full px-3 py-1 transition-all",
                      granularity === g ? "grad-emerald text-white shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {g === "day" ? t("mon.day") : t("mon.hour")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!result ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : result.readings === 0 ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">{t("mon.noData")}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {fill(t("mon.summary"), { readings: result.readings.toLocaleString(locale), meters: result.meterCount, days: result.days })}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={t("mon.kpi.total")}
              value={Math.round(result.total)}
              unit="kWh"
              icon={Zap}
              tone="emerald"
              trend={result.trendPct ?? undefined}
              trendLabel={result.trendPct !== null ? t("mon.vsPrev") : undefined}
            />
            <KpiCard
              label={t("mon.kpi.avgDaily")}
              value={Math.round(result.avgDaily)}
              unit="kWh"
              icon={Activity}
              tone="sky"
              hint={fill(t("mon.daysHint"), { n: result.days })}
            />
            <KpiCard
              label={t("mon.kpi.maxDay")}
              value={result.maxDay ? Math.round(result.maxDay.kwh) : "—"}
              unit={result.maxDay ? "kWh" : undefined}
              icon={CalendarDays}
              tone="amber"
              hint={result.maxDay ? dayLabel(result.maxDay.day) : undefined}
            />
            <KpiCard
              label={t("mon.kpi.peakHour")}
              value={result.peakHour ? Math.round(result.peakHour.kwh * 10) / 10 : "—"}
              unit={result.peakHour ? "kWh" : undefined}
              icon={Clock}
              tone="rose"
              hint={result.peakHour ? `${fmtTs(result.peakHour.ts)} UTC` : undefined}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("mon.chart.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeSeriesChart data={result.series} formatTick={formatTick} locale={locale} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>{t("mon.table.title")}</CardTitle>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" />
                {t("common.exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("mon.table.day")}</TableHead>
                    <TableHead>{t("table.kwh")}</TableHead>
                    <TableHead>{t("mon.table.share")}</TableHead>
                    <TableHead className="min-w-[10rem]">{t("mon.table.level")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.daily.map((d) => {
                    const isMax = result.maxDay?.day === d.day;
                    return (
                      <TableRow key={d.day}>
                        <TableCell className="font-medium capitalize">
                          {dayLabel(d.day)}
                          {isMax && <Badge className="ml-2 border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">{t("mon.badge.max")}</Badge>}
                        </TableCell>
                        <TableCell>{d.kwh.toLocaleString(locale)}</TableCell>
                        <TableCell>
                          {(result.total > 0 ? (d.kwh / result.total) * 100 : 0).toLocaleString(locale, { maximumFractionDigits: 1 })} %
                        </TableCell>
                        <TableCell>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", isMax ? "grad-amber" : "grad-emerald")}
                              style={{ width: `${(d.kwh / maxKwh) * 100}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
