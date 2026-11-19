"use client";

import { useEffect, useState } from "react";
import { Clock, Gauge, Moon, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessDenied } from "@/components/common/AccessDenied";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopMeters } from "@/components/dashboard/TopMeters";
import { BuildingBarChart } from "@/components/charts/BuildingBarChart";
import { BuildingsLineChart } from "@/components/charts/BuildingsLineChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { ProfileChart } from "@/components/charts/ProfileChart";
import { ShareDonutChart } from "@/components/charts/ShareDonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BUILDING_COLORS, FALLBACK_COLOR } from "@/lib/config";
import { fill } from "@/lib/format";
import { getAnalytics } from "@/services/analytics";
import { getBuildingShare, getConsumptionSeries, getHeatmap, getTopMeters } from "@/services/dashboard";

type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;
type Share = Awaited<ReturnType<typeof getBuildingShare>>;
type Series = Awaited<ReturnType<typeof getConsumptionSeries>>;
type Heat = Awaited<ReturnType<typeof getHeatmap>>;
type Top = Awaited<ReturnType<typeof getTopMeters>>;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const allowed = user?.role === "ADMIN" || user?.role === "ANALYST";

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [share, setShare] = useState<Share | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [heat, setHeat] = useState<Heat | null>(null);
  const [top, setTop] = useState<Top | null>(null);

  useEffect(() => {
    if (!user || !allowed) return;
    const scope = user.buildingIds;
    Promise.all([
      getAnalytics(scope), getBuildingShare(scope), getConsumptionSeries("7d", scope),
      getHeatmap(scope), getTopMeters(10, scope),
    ]).then(([a, s, se, h, tp]) => {
      setData(a);
      setShare(s);
      setSeries(se);
      setHeat(h);
      setTop(tp);
    });
  }, [user, allowed]);

  if (user && !allowed) return <AccessDenied />;
  if (!data || !share || !series || !heat || !top) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });
  const formatDay = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const pct = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
  const buildingName = (id: string) => data.buildings.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <PageHeader titleKey="page.analytics.title" descKey="page.analytics.desc" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("ana.kpi.top")}
          value={data.top?.name ?? "—"}
          icon={Trophy}
          tone="emerald"
          hint={data.top ? fill(t("ana.kpi.topHint"), { pct: pct(data.top.share) }) : undefined}
        />
        <KpiCard
          label={t("ana.kpi.avgMeter")}
          value={data.avgPerMeterDay}
          unit="kWh"
          icon={Gauge}
          tone="sky"
          hint={t("ana.kpi.avgMeterHint")}
        />
        <KpiCard
          label={t("ana.kpi.offHours")}
          value={`${pct(data.offHoursPct)} %`}
          icon={Moon}
          tone="amber"
          hint={t("ana.kpi.offHoursHint")}
        />
        <KpiCard
          label={t("ana.kpi.peak")}
          value={data.peak ? data.peak.kwh : "—"}
          unit={data.peak ? "kWh" : undefined}
          icon={Clock}
          tone="rose"
          hint={data.peak ? `${fmt(data.peak.ts)} UTC` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("ana.chart.compare")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BuildingBarChart data={data.buildings.map((b) => ({ name: b.name, kwh: b.total }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("ana.chart.intensity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BuildingBarChart data={data.buildings.map((b) => ({ name: b.name, kwh: b.kwhPerM2 }))} unit=" kWh/m²" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("ana.chart.evolution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BuildingsLineChart data={series.data} series={series.series} formatTick={formatDay} locale={locale} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("ana.chart.share")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareDonutChart data={share} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("ana.chart.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("ana.chart.profileHint")}</p>
            <ProfileChart
              data={data.profile}
              weekdayLabel={t("ana.profile.weekday")}
              weekendLabel={t("ana.profile.weekend")}
              locale={locale}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("ana.chart.top")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TopMeters items={top} buildingName={buildingName} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("ana.chart.heatmap")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Heatmap rows={heat.rows} max={heat.max} locale={locale} />
          <p className="text-xs text-muted-foreground">{t("dash.chart.heatmapHint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("ana.stats.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.building")}</TableHead>
                <TableHead>{t("ana.stats.total")}</TableHead>
                <TableHead>{t("ana.stats.share")}</TableHead>
                <TableHead>{t("ana.stats.avgHour")}</TableHead>
                <TableHead>{t("ana.stats.std")}</TableHead>
                <TableHead>{t("ana.stats.peak")}</TableHead>
                <TableHead>{t("ana.stats.offHours")}</TableHead>
                <TableHead>{t("ana.stats.perMeter")}</TableHead>
                <TableHead>{t("ana.stats.intensity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.buildings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        className="h-5 w-1.5 rounded-full"
                        style={{ backgroundColor: BUILDING_COLORS[b.id] ?? FALLBACK_COLOR }}
                      />
                      {b.name}
                    </span>
                  </TableCell>
                  <TableCell>{b.total.toLocaleString(locale)}</TableCell>
                  <TableCell>{pct(b.share)} %</TableCell>
                  <TableCell>{b.avgHourly.toLocaleString(locale)} kWh</TableCell>
                  <TableCell>{b.std.toLocaleString(locale)}</TableCell>
                  <TableCell>
                    {b.peak ? (
                      <>
                        <span className="block">{b.peak.kwh.toLocaleString(locale)} kWh</span>
                        <span className="block text-xs text-muted-foreground">{fmt(b.peak.ts)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{pct(b.offHoursPct)} %</TableCell>
                  <TableCell>{b.perMeter.toLocaleString(locale)}</TableCell>
                  <TableCell>{b.kwhPerM2.toLocaleString(locale, { maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">{t("ana.note")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
