"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, Building2, Coins, Gauge, Leaf, Target, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopMeters } from "@/components/dashboard/TopMeters";
import { SilentMetersAlert, SystemHealthCard } from "@/components/dashboard/SystemHealth";
import { AnomalyOverviewCard, PriorityQueueCard } from "@/components/dashboard/AnomalyAdmin";
import { ActivityCard, QuickActionsCard } from "@/components/dashboard/AdminExtras";
import { BuildingsLineChart } from "@/components/charts/BuildingsLineChart";
import { ShareDonutChart } from "@/components/charts/ShareDonutChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAnomalies, getBuildings, getKpis, getLatestMeasurements } from "@/services/energy";
import {
  getAnomalyOverview, getBuildingShare, getConsumptionSeries, getHeatmap, getKpiTrends,
  getPriorityQueue, getRecentActivity, getSystemHealth, getTopMeters, setAnomalyStatus,
  type Period,
} from "@/services/dashboard";
import { CURRENCY_CODE } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Anomaly, AnomalyStatus, Building, Measurement } from "@/types";

type Kpis = Awaited<ReturnType<typeof getKpis>>;
type Trends = Awaited<ReturnType<typeof getKpiTrends>>;
type Series = Awaited<ReturnType<typeof getConsumptionSeries>>;
type Share = Awaited<ReturnType<typeof getBuildingShare>>;
type Heat = Awaited<ReturnType<typeof getHeatmap>>;
type Top = Awaited<ReturnType<typeof getTopMeters>>;
type Health = Awaited<ReturnType<typeof getSystemHealth>>;
type Overview = Awaited<ReturnType<typeof getAnomalyOverview>>;
type Activities = Awaited<ReturnType<typeof getRecentActivity>>;

const severityKey = {
  LOW: "severity.LOW",
  MEDIUM: "severity.MEDIUM",
  HIGH: "severity.HIGH",
} as const;

const PERIODS: Period[] = ["24h", "3d", "7d"];
const periodKey = {
  "24h": "dash.period.24h",
  "3d": "dash.period.3d",
  "7d": "dash.period.7d",
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === "ADMIN";

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [share, setShare] = useState<Share>([]);
  const [heat, setHeat] = useState<Heat>({ rows: [], max: 0 });
  const [top, setTop] = useState<Top>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [latest, setLatest] = useState<Measurement[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queue, setQueue] = useState<Anomaly[] | null>(null);
  const [activity, setActivity] = useState<Activities | null>(null);
  const [period, setPeriod] = useState<Period>("7d");
  const [series, setSeries] = useState<Series | null>(null);

  useEffect(() => {
    if (!user) return;
    const scope = user.buildingIds;
    const admin = user.role === "ADMIN";
    Promise.all([
      getKpis(scope), getKpiTrends(scope), getBuildingShare(scope), getHeatmap(scope),
      getTopMeters(5, scope), getAnomalies(scope), getLatestMeasurements(8, scope), getBuildings(scope),
      admin ? getSystemHealth() : Promise.resolve(null),
      admin ? getAnomalyOverview() : Promise.resolve(null),
      admin ? getPriorityQueue(6) : Promise.resolve(null),
      admin ? getRecentActivity() : Promise.resolve(null),
    ]).then(([k, tr, sh, hm, tp, an, lt, bs, hl, ov, qu, ac]) => {
      setKpis(k); setTrends(tr); setShare(sh); setHeat(hm); setTop(tp);
      setAnomalies(an.slice(0, 5)); setLatest(lt); setBuildings(bs);
      setHealth(hl); setOverview(ov); setQueue(qu); setActivity(ac);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getConsumptionSeries(period, user.buildingIds).then(setSeries);
  }, [user, period]);

  const handleStatus = useCallback(async (id: string, status: AnomalyStatus) => {
    await setAnomalyStatus(id, status);
    const [o, q] = await Promise.all([getAnomalyOverview(), getPriorityQueue(6)]);
    setOverview(o);
    setQueue(q);
  }, []);

  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  const formatTick = (ts: number) => {
    const d = new Date(ts);
    if (period === "7d") return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" });
    if (period === "24h") return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", timeZone: "UTC" });
  };

  if (!kpis || !trends || !series) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  const targetTone = trends.targetPct < 85 ? "emerald" : trends.targetPct < 100 ? "amber" : "rose";

  return (
    <div className="space-y-6">
      <PageHeader titleKey="page.dashboard.title" descKey="page.dashboard.desc" />

      {isAdmin && health && <SilentMetersAlert health={health} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("dashboard.kpi.buildings")} value={kpis.buildings} icon={Building2} tone="emerald" />
        <KpiCard label={t("dashboard.kpi.meters")} value={kpis.meters} icon={Gauge} tone="sky" />
        <KpiCard
          label={t("dashboard.kpi.consumption24h")}
          value={kpis.kwh24h}
          unit="kWh"
          icon={Zap}
          tone="amber"
          trend={trends.trendPct}
          trendLabel={t("dash.trend.vsYesterday")}
          spark={trends.sparkline}
        />
        <KpiCard label={t("dashboard.kpi.anomalies")} value={kpis.anomalies} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("dash.kpi.cost24h")}
          value={trends.cost24h.toLocaleString(locale, { style: "currency", currency: CURRENCY_CODE, maximumFractionDigits: 0 })}
          icon={Coins}
          tone="emerald"
          trend={trends.trendPct}
          trendLabel={t("dash.trend.vsYesterday")}
          spark={trends.sparkline}
        />
        <KpiCard
          label={t("dash.kpi.co2")}
          value={Math.round(trends.co2Kg24h)}
          unit="kg"
          icon={Leaf}
          tone="sky"
          spark={trends.sparkline}
        />
        <KpiCard
          label={t("dash.kpi.peak")}
          value={Math.round(trends.peak.kwh * 10) / 10}
          unit="kWh"
          icon={Activity}
          tone="amber"
          hint={`${fmt(trends.peak.timestamp)} UTC`}
        />
        <KpiCard
          label={t("dash.kpi.target")}
          value={`${Math.round(trends.targetPct)} %`}
          icon={Target}
          tone={targetTone}
          progress={trends.targetPct}
          hint={`${Math.round(trends.periodTotal).toLocaleString(locale)} / ${Math.round(trends.target).toLocaleString(locale)} kWh`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dash.chart.byBuildingTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-end">
              <div className="flex items-center rounded-full border bg-muted p-0.5 text-xs font-semibold">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={period === p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-full px-3 py-1 transition-all",
                      period === p ? "grad-emerald text-white shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(periodKey[p])}
                  </button>
                ))}
              </div>
            </div>
            <BuildingsLineChart data={series.data} series={series.series} formatTick={formatTick} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dash.chart.share")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareDonutChart data={share} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dash.chart.heatmap")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Heatmap rows={heat.rows} max={heat.max} locale={locale} />
            <p className="text-xs text-muted-foreground">{t("dash.chart.heatmapHint")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dash.chart.topMeters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TopMeters items={top} buildingName={buildingName} locale={locale} />
          </CardContent>
        </Card>
      </div>

      {isAdmin && health && overview && queue && activity && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SystemHealthCard health={health} />
            </div>
            <AnomalyOverviewCard overview={overview} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PriorityQueueCard queue={queue} buildingName={buildingName} onStatusChange={handleStatus} />
            </div>
            <div className="space-y-4">
              <QuickActionsCard />
              <ActivityCard items={activity} />
            </div>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.latestAnomalies")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.meter")}</TableHead>
                  <TableHead>{t("table.building")}</TableHead>
                  <TableHead>{t("table.kwh")}</TableHead>
                  <TableHead>{t("table.severity")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.meterId}</TableCell>
                    <TableCell>{buildingName(a.buildingId)}</TableCell>
                    <TableCell>{a.kwh}</TableCell>
                    <TableCell>
                      <Badge variant={a.severity === "HIGH" ? "destructive" : "secondary"}>
                        {t(severityKey[a.severity])}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.latestMeasurements")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.meter")}</TableHead>
                  <TableHead>{t("table.building")}</TableHead>
                  <TableHead>{t("table.dateUtc")}</TableHead>
                  <TableHead>{t("table.kwh")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{m.meterId}</TableCell>
                    <TableCell>{buildingName(m.buildingId)}</TableCell>
                    <TableCell>{fmt(m.timestamp)}</TableCell>
                    <TableCell>{m.kwh}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
