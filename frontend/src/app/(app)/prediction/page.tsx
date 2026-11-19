"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Coins, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessDenied } from "@/components/common/AccessDenied";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CURRENCY_CODE } from "@/lib/config";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getBuildings } from "@/services/energy";
import { getPrediction, type PredictionData } from "@/services/prediction";
import type { Building } from "@/types";

const dayTypeKey = { WD: "pred.dayType.WD", WE: "pred.dayType.WE" } as const;
const selectClass =
  "h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function PredictionPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "ANALYST") return <AccessDenied />;
  return <PredictionContent scope={user.buildingIds} />;
}

function PredictionContent({ scope }: { scope: string[] }) {
  const { t, locale } = useI18n();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState("ALL");
  const [data, setData] = useState<PredictionData | null>(null);

  useEffect(() => {
    getBuildings(scope).then(setBuildings);
  }, [scope]);

  useEffect(() => {
    getPrediction(buildingId, scope).then(setData);
  }, [buildingId, scope]);

  const formatTick = (ts: number) =>
    new Date(ts).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", timeZone: "UTC" });
  const dayLabel = (ms: number, long = false) =>
    new Date(ms).toLocaleDateString(locale, {
      weekday: long ? "long" : "short",
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    });
  const money = (n: number) =>
    n.toLocaleString(locale, { style: "currency", currency: CURRENCY_CODE, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.prediction.title" descKey="page.prediction.desc" />
        <div className="flex items-center gap-2">
          <label htmlFor="pred-building" className="text-sm text-muted-foreground">
            {t("pred.building")}
          </label>
          <select id="pred-building" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={selectClass}>
            <option value="ALL">{t("pred.allBuildings")}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!data ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : !data.hasData ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">{t("pred.noData")}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={`${t("pred.kpi.tomorrow")} · ${dayLabel(data.daily[0].day)}`}
              value={Math.round(data.tomorrow.kwh)}
              unit="kWh"
              icon={CalendarDays}
              tone="amber"
              trend={data.tomorrow.trendPct ?? undefined}
              trendLabel={data.tomorrow.trendPct !== null ? t("pred.vsLast") : undefined}
              hint={
                data.tomorrow.peak
                  ? fill(t("pred.kpi.tomorrowHint"), {
                      kwh: Math.round(data.tomorrow.peak.kwh * 10) / 10,
                      hour: new Date(data.tomorrow.peak.ts).getUTCHours(),
                    })
                  : undefined
              }
            />
            <KpiCard
              label={t("pred.kpi.week")}
              value={data.week.kwh}
              unit="kWh"
              icon={TrendingUp}
              tone="emerald"
              trend={data.week.trendPct ?? undefined}
              trendLabel={data.week.trendPct !== null ? t("pred.vsLastWeek") : undefined}
            />
            <KpiCard label={t("pred.kpi.cost")} value={money(data.week.cost)} icon={Coins} tone="sky" />
            <KpiCard
              label={t("pred.kpi.accuracy")}
              value={`${data.mapePct.toLocaleString(locale, { maximumFractionDigits: 1 })} %`}
              icon={Target}
              tone="rose"
              hint={t("pred.kpi.accuracyHint")}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("pred.chart.main")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastChart
                data={data.chart}
                splitTs={data.splitTs}
                actualLabel={t("pred.series.actual")}
                forecastLabel={t("pred.series.forecast")}
                formatTick={formatTick}
                locale={locale}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("pred.chart.backtest")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{t("pred.chart.backtestHint")}</p>
                <ForecastChart
                  data={data.backtest}
                  actualLabel={t("pred.series.actual")}
                  forecastLabel={t("pred.series.forecast")}
                  formatTick={formatTick}
                  locale={locale}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("pred.table.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("pred.table.day")}</TableHead>
                      <TableHead>{t("pred.table.kwh")}</TableHead>
                      <TableHead>{t("pred.table.cost")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.daily.map((d) => (
                      <TableRow key={d.day}>
                        <TableCell>
                          <span className="block font-medium capitalize">{dayLabel(d.day)}</span>
                          <span
                            className={cn(
                              "text-xs",
                              d.weekend ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                            )}
                          >
                            {t(dayTypeKey[d.weekend ? "WE" : "WD"])}
                          </span>
                        </TableCell>
                        <TableCell>{d.kwh.toLocaleString(locale)}</TableCell>
                        <TableCell>{money(d.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">{t("pred.note")}</p>
        </>
      )}
    </div>
  );
}
