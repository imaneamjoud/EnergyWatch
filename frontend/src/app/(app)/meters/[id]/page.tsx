"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Gauge, Pencil, WifiOff, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { statusKey } from "@/components/dashboard/AnomalyAdmin";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { MeterFormDialog } from "@/components/meters/MeterFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getBuildings } from "@/services/energy";
import type { Period } from "@/services/dashboard";
import { getMeterDetail, getMeterSeries, updateMeter, type MeterInput } from "@/services/meters";
import type { Building } from "@/types";

type Detail = NonNullable<Awaited<ReturnType<typeof getMeterDetail>>>;
type Series = Awaited<ReturnType<typeof getMeterSeries>>;

const PERIODS: Period[] = ["24h", "3d", "7d"];
const periodKey = { "24h": "dash.period.24h", "3d": "dash.period.3d", "7d": "dash.period.7d" } as const;
const severityKey = { LOW: "severity.LOW", MEDIUM: "severity.MEDIUM", HIGH: "severity.HIGH" } as const;
const meterStatusKey = { ACTIVE: "meter.status.ACTIVE", INACTIVE: "meter.status.INACTIVE" } as const;

export default function MeterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === "ADMIN";

  const [data, setData] = useState<Detail | null | undefined>(undefined);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [period, setPeriod] = useState<Period>("7d");
  const [series, setSeries] = useState<Series | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [d, b] = await Promise.all([getMeterDetail(id, user.buildingIds), getBuildings(user.buildingIds)]);
    setData(d);
    setBuildings(b);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getMeterSeries(id, period).then(setSeries);
  }, [id, period]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  const formatTick = (ts: number) => {
    const d = new Date(ts);
    if (period === "7d") return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", timeZone: "UTC" });
    return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  };

  if (data === undefined) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const back = (
    <Link
      href="/meters"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("meters.detail.back")}
    </Link>
  );

  if (data === null) {
    return (
      <div className="space-y-4">
        {back}
        <p className="text-sm text-muted-foreground">{t("meters.detail.notFound")}</p>
      </div>
    );
  }

  const r = data.row;

  const handleUpdate = async (input: MeterInput) => {
    const res = await updateMeter(r.id, input);
    if (res.ok) await load();
    return res;
  };

  const info: [string, React.ReactNode][] = [
    [
      t("meters.detail.building"),
      <Link key="b" href={`/buildings/${r.buildingId}`} className="hover:underline">
        {r.buildingName}
      </Link>,
    ],
    [t("meters.detail.location"), r.location || "—"],
    [
      t("table.status"),
      <span
        key="s"
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          r.status === "ACTIVE"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
        )}
      >
        {t(meterStatusKey[r.status])}
      </span>,
    ],
    [t("meters.detail.installed"), new Date(r.installedAt).toLocaleDateString(locale, { dateStyle: "medium", timeZone: "UTC" })],
    [t("meters.detail.avgHour"), `${data.avgHourly.toLocaleString(locale)} kWh`],
    [t("meters.detail.peak"), data.peak ? `${data.peak.kwh} kWh · ${fmt(data.peak.ts)}` : "—"],
  ];

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grad-sky flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-sky-500/30">
            <Gauge className="h-6 w-6 text-white" />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{r.id}</h2>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", r.online ? "bg-emerald-500" : "animate-pulse bg-rose-500")} />
              {r.online ? t("meters.transmission.online") : t("meters.transmission.silent")} · {r.buildingName}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("meters.edit")}
          </Button>
        )}
      </div>

      {!r.online && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300"
        >
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {r.lastTs ? fill(t("meters.detail.silentAlert"), { date: fmt(r.lastTs) }) : t("meters.detail.noData")}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("meters.detail.lastValue")}
          value={r.lastKwh ?? "—"}
          unit={r.lastKwh !== null ? "kWh" : undefined}
          icon={Gauge}
          tone="sky"
          hint={r.lastTs ? `${fmt(r.lastTs)} UTC` : undefined}
        />
        <KpiCard label={t("meters.detail.kwh24h")} value={Math.round(data.kwh24h * 10) / 10} unit="kWh" icon={Zap} tone="amber" />
        <KpiCard label={t("meters.detail.kwh7d")} value={Math.round(data.kwh7d)} unit="kWh" icon={Zap} tone="emerald" />
        <KpiCard
          label={t("meters.detail.anomalies")}
          value={r.anomalyCount}
          icon={AlertTriangle}
          tone="rose"
          hint={fill(t("meters.detail.openHint"), { n: r.openAnomalies })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("meters.detail.info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {info.map(([label, value], i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("meters.detail.chart")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t("meters.detail.chartHint")}</p>
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
            {series && series.data.length > 0 ? (
              <TimeSeriesChart data={series.data} anomalies={series.anomalies} formatTick={formatTick} locale={locale} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("meters.detail.noChartData")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("meters.detail.latest")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.latest.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("meters.detail.noData")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.dateUtc")}</TableHead>
                    <TableHead>{t("table.kwh")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.latest.map((m) => (
                    <TableRow key={m.timestamp}>
                      <TableCell>{fmt(m.timestamp)}</TableCell>
                      <TableCell className="font-medium">{m.kwh}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("meters.detail.anomalyList")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.anomalies.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("meters.detail.noAnomalies")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.dateUtc")}</TableHead>
                    <TableHead>{t("table.kwh")}</TableHead>
                    <TableHead>{t("table.expected")}</TableHead>
                    <TableHead>{t("table.method")}</TableHead>
                    <TableHead>{t("table.severity")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.anomalies.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{fmt(a.timestamp)}</TableCell>
                      <TableCell>{a.kwh}</TableCell>
                      <TableCell>{a.expectedKwh}</TableCell>
                      <TableCell>{a.method}</TableCell>
                      <TableCell>
                        <Badge variant={a.severity === "HIGH" ? "destructive" : "secondary"}>
                          {t(severityKey[a.severity])}
                        </Badge>
                      </TableCell>
                      <TableCell>{t(statusKey[a.status])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <MeterFormDialog open={formOpen} onOpenChange={setFormOpen} meter={r} buildings={buildings} onSubmit={handleUpdate} />
      )}
    </div>
  );
}
