"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Gauge, Pencil, Ruler, Trash2, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { statusKey } from "@/components/dashboard/AnomalyAdmin";
import { ConsumptionLineChart } from "@/components/charts/ConsumptionLineChart";
import { BuildingFormDialog } from "@/components/buildings/BuildingFormDialog";
import { DeleteBuildingDialog } from "@/components/buildings/DeleteBuildingDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { typeKey, typeStyle } from "@/lib/buildingTypes";
import { BUILDING_COLORS, FALLBACK_COLOR } from "@/lib/config";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  deleteBuilding, getBuildingDetail, updateBuilding, type BuildingInput,
} from "@/services/buildings";

type Detail = NonNullable<Awaited<ReturnType<typeof getBuildingDetail>>>;

const severityKey = {
  LOW: "severity.LOW",
  MEDIUM: "severity.MEDIUM",
  HIGH: "severity.HIGH",
} as const;

const meterStatusKey = {
  ACTIVE: "meter.status.ACTIVE",
  INACTIVE: "meter.status.INACTIVE",
} as const;

export default function BuildingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  const [data, setData] = useState<Detail | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setData(await getBuildingDetail(id, user.buildingIds));
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  if (data === undefined) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const back = (
    <Link
      href="/buildings"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("buildings.detail.back")}
    </Link>
  );

  if (data === null) {
    return (
      <div className="space-y-4">
        {back}
        <p className="text-sm text-muted-foreground">{t("buildings.detail.notFound")}</p>
      </div>
    );
  }

  const s = data.stats;

  const handleUpdate = async (input: BuildingInput) => {
    const res = await updateBuilding(s.id, input);
    if (res.ok) await load();
    return res;
  };
  const handleDelete = async (bid: string) => {
    const res = await deleteBuilding(bid);
    if (res.ok) router.push("/buildings");
    return res;
  };

  const info: [string, string][] = [
    [t("buildings.detail.type"), t(typeKey[s.type])],
    [t("buildings.detail.address"), s.address || "—"],
    [t("buildings.detail.surface"), `${s.surfaceM2.toLocaleString(locale)} m²`],
    [t("buildings.detail.floors"), String(s.floors)],
    [
      t("buildings.detail.created"),
      new Date(s.createdAt).toLocaleDateString(locale, { dateStyle: "medium", timeZone: "UTC" }),
    ],
    [t("buildings.detail.lastMeasurement"), s.lastMeasurementTs ? `${fmt(s.lastMeasurementTs)} UTC` : "—"],
  ];

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="h-12 w-1.5 rounded-full"
            style={{ backgroundColor: BUILDING_COLORS[s.id] ?? FALLBACK_COLOR }}
          />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{s.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", typeStyle[s.type])}>
                {t(typeKey[s.type])}
              </span>
              <span>{s.address || "—"}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("buildings.edit")}
            </Button>
            <Button variant="outline" className="text-rose-500 hover:text-rose-500" onClick={() => setDeleting(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("buildings.delete")}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("buildings.kpi.meters")}
          value={`${s.activeMeters} / ${s.meterCount}`}
          icon={Gauge}
          tone="sky"
          hint={s.inactiveMeters > 0 ? fill(t("buildings.meters.inactive"), { n: s.inactiveMeters }) : undefined}
        />
        <KpiCard label={t("buildings.kpi.consumption")} value={Math.round(s.kwh7d)} unit="kWh" icon={Zap} tone="amber" />
        <KpiCard
          label={t("buildings.kpi.intensity")}
          value={s.kwhPerM2.toLocaleString(locale, { maximumFractionDigits: 2 })}
          unit="kWh/m²"
          icon={Ruler}
          tone="emerald"
        />
        <KpiCard label={t("buildings.kpi.openAnomalies")} value={s.openAnomalies} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("buildings.detail.info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {info.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("buildings.detail.chart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumptionLineChart data={data.daily} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("buildings.detail.meters")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.meters.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("buildings.detail.noMeters")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.meter")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("table.lastMeasurement")}</TableHead>
                    <TableHead>{t("table.kwh")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.meters.map((m) => (
                    <TableRow key={m.meter.id}>
                      <TableCell>
                        <Link href={`/meters/${m.meter.id}`} className="font-medium hover:underline">
                          {m.meter.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            m.meter.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {t(meterStatusKey[m.meter.status])}
                        </span>
                      </TableCell>
                      <TableCell>{m.lastTs ? fmt(m.lastTs) : "—"}</TableCell>
                      <TableCell>{m.kwh7d.toLocaleString(locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("buildings.detail.anomalies")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.anomalies.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("buildings.detail.noAnomalies")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.dateUtc")}</TableHead>
                    <TableHead>{t("table.meter")}</TableHead>
                    <TableHead>{t("table.kwh")}</TableHead>
                    <TableHead>{t("table.expected")}</TableHead>
                    <TableHead>{t("table.severity")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.anomalies.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{fmt(a.timestamp)}</TableCell>
                      <TableCell className="font-medium">{a.meterId}</TableCell>
                      <TableCell>{a.kwh}</TableCell>
                      <TableCell>{a.expectedKwh}</TableCell>
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
        <>
          <BuildingFormDialog open={formOpen} onOpenChange={setFormOpen} building={s} onSubmit={handleUpdate} />
          <DeleteBuildingDialog building={deleting ? s : null} onClose={() => setDeleting(false)} onConfirm={handleDelete} />
        </>
      )}
    </div>
  );
}
