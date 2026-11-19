"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2, Download, Hourglass, Info, Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Pagination } from "@/components/common/Pagination";
import { SortHead } from "@/components/common/SortHead";
import { AnomalyDetailDialog } from "@/components/anomalies/AnomalyDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { anomalyStatusKey, severityKey, statusStyle } from "@/lib/anomalyReco";
import { IQR_FACTOR, Z_THRESHOLD } from "@/lib/config";
import { downloadCsv } from "@/lib/csv";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAnomalyRows, type AnomalyRow } from "@/services/anomalies";
import { setAnomalyStatus } from "@/services/dashboard";
import { getBuildings } from "@/services/energy";
import type { AnomalyStatus, Building, Severity } from "@/types";

type SortKey = "timestamp" | "meterId" | "buildingName" | "kwh" | "deviationPct" | "method" | "severity" | "status";

const PAGE_SIZE = 10;
const SEV_RANK: Record<Severity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const STATUS_RANK: Record<AnomalyStatus, number> = { NEW: 0, IN_PROGRESS: 1, RESOLVED: 2 };
const selectClass =
  "h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function sortValue(r: AnomalyRow, k: SortKey): string | number {
  if (k === "severity") return SEV_RANK[r.severity];
  if (k === "status") return STATUS_RANK[r.status];
  return r[k];
}

export default function AnomaliesPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  // Qui peut changer le statut d'une anomalie : l'administrateur et le responsable de bâtiment
  const canUpdate = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [rows, setRows] = useState<AnomalyRow[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AnomalyStatus | "ALL">("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [r, b] = await Promise.all([getAnomalyRows(user.buildingIds), getBuildings(user.buildingIds)]);
    setRows(r);
    setBuildings(b);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, buildingFilter, severityFilter, statusFilter, methodFilter, sortKey, sortDir]);

  const methods = useMemo(() => [...new Set((rows ?? []).map((r) => r.method))], [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (rows ?? []).filter(
      (r) =>
        (buildingFilter === "ALL" || r.buildingId === buildingFilter) &&
        (severityFilter === "ALL" || r.severity === severityFilter) &&
        (statusFilter === "ALL" || r.status === statusFilter) &&
        (methodFilter === "ALL" || r.method === methodFilter) &&
        (!q || r.meterId.toLowerCase().includes(q) || r.buildingName.toLowerCase().includes(q))
    );
    return [...filtered].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp =
        typeof va === "string" && typeof vb === "string"
          ? va.localeCompare(vb, locale, { numeric: true })
          : Number(va) - Number(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, search, buildingFilter, severityFilter, statusFilter, methodFilter, sortKey, sortDir, locale]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "meterId" || k === "buildingName" || k === "method" ? "asc" : "desc");
    }
  };

  const onStatusChange = async (id: string, status: AnomalyStatus) => {
    await setAnomalyStatus(id, status);
    await load();
  };

  const exportCsv = () => {
    const header = [
      t("table.dateUtc"), t("table.meter"), t("table.building"), "kWh", t("table.expected"),
      `${t("anom.col.deviation")} %`, t("table.method"), t("table.severity"), t("table.status"),
    ];
    const body = visible.map((r) => [
      r.timestamp, r.meterId, r.buildingName, r.kwh, r.expectedKwh, r.deviationPct, r.method,
      t(severityKey[r.severity]), t(anomalyStatusKey[r.status]),
    ]);
    downloadCsv("energyinsight_anomalies.csv", [header, ...body]);
  };

  if (!rows) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const count = (s: AnomalyStatus) => rows.filter((r) => r.status === s).length;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <PageHeader titleKey="page.anomalies.title" descKey="page.anomalies.desc" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("anom.kpi.total")} value={rows.length} icon={AlertTriangle} tone="rose" />
        <KpiCard label={t("anom.kpi.new")} value={count("NEW")} icon={AlertCircle} tone="amber" />
        <KpiCard label={t("anom.kpi.inProgress")} value={count("IN_PROGRESS")} icon={Hourglass} tone="sky" />
        <KpiCard label={t("anom.kpi.resolved")} value={count("RESOLVED")} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {fill(t("anom.detectionInfo"), { z: Z_THRESHOLD, iqr: IQR_FACTOR })}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("anom.search")} className="pl-9" />
            </div>
            <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} aria-label={t("table.building")} className={selectClass}>
              <option value="ALL">{t("anom.filter.allBuildings")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as Severity | "ALL")} aria-label={t("table.severity")} className={selectClass}>
              <option value="ALL">{t("anom.filter.allSeverity")}</option>
              {(["HIGH", "MEDIUM", "LOW"] as const).map((s) => (
                <option key={s} value={s}>{t(severityKey[s])}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AnomalyStatus | "ALL")} aria-label={t("table.status")} className={selectClass}>
              <option value="ALL">{t("anom.filter.allStatus")}</option>
              {(["NEW", "IN_PROGRESS", "RESOLVED"] as const).map((s) => (
                <option key={s} value={s}>{t(anomalyStatusKey[s])}</option>
              ))}
            </select>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} aria-label={t("table.method")} className={selectClass}>
              <option value="ALL">{t("anom.filter.allMethods")}</option>
              {methods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              {t("common.exportCsv")}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">{fill(t("anom.resultCount"), { n: visible.length })}</p>

          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("anom.empty")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead label={t("table.dateUtc")} k="timestamp" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("table.meter")} k="meterId" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("table.building")} k="buildingName" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("table.kwh")} k="kwh" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("anom.col.deviation")} k="deviationPct" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("table.method")} k="method" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("table.severity")} k="severity" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <SortHead label={t("table.status")} k="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedId(r.id);
                      }}
                    >
                      <TableCell>{fmt(r.timestamp)}</TableCell>
                      <TableCell className="font-semibold">{r.meterId}</TableCell>
                      <TableCell>{r.buildingName}</TableCell>
                      <TableCell>
                        <span className="block font-medium">{r.kwh}</span>
                        <span className="block text-xs text-muted-foreground">
                          {t("table.expected")} : {r.expectedKwh}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-rose-500">
                        {r.deviationPct > 0 ? "+" : ""}
                        {r.deviationPct.toLocaleString(locale)} %
                      </TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell>
                        <Badge variant={r.severity === "HIGH" ? "destructive" : "secondary"}>
                          {t(severityKey[r.severity])}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusStyle[r.status])}>
                          {t(anomalyStatusKey[r.status])}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={current} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <AnomalyDetailDialog
        anomaly={selected}
        onClose={() => setSelectedId(null)}
        canUpdate={canUpdate}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
