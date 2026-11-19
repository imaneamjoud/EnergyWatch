"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gauge, Plus, Search, Signal, WifiOff, PowerOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Pagination } from "@/components/common/Pagination";
import { MeterFormDialog } from "@/components/meters/MeterFormDialog";
import { MetersTable, type MeterSortKey } from "@/components/meters/MetersTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SILENT_AFTER_HOURS } from "@/lib/config";
import { fill } from "@/lib/format";
import { getBuildings } from "@/services/energy";
import { createMeter, getMeterRows, updateMeter, type MeterInput, type MeterRow } from "@/services/meters";
import type { Building } from "@/types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "SILENT";
const PAGE_SIZE = 10;

const selectClass =
  "h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const sortVal = (r: MeterRow, k: MeterSortKey): string | number => {
  if (k === "lastTs") return r.lastTs ?? "";
  return r[k];
};

export default function MetersPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === "ADMIN";

  const [rows, setRows] = useState<MeterRow[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<MeterSortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MeterRow | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [r, b] = await Promise.all([getMeterRows(user.buildingIds), getBuildings(user.buildingIds)]);
    setRows(r);
    setBuildings(b);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, buildingFilter, statusFilter, sortKey, sortDir]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (rows ?? []).filter((m) => {
      if (buildingFilter !== "ALL" && m.buildingId !== buildingFilter) return false;
      if (statusFilter === "ACTIVE" && m.status !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && m.status !== "INACTIVE") return false;
      if (statusFilter === "SILENT" && m.online) return false;
      return !q || m.id.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sortKey);
      const vb = sortVal(b, sortKey);
      const cmp =
        typeof va === "string" && typeof vb === "string"
          ? va.localeCompare(vb, locale, { numeric: true })
          : Number(va) - Number(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, search, buildingFilter, statusFilter, sortKey, sortDir, locale]);

  const onSort = (k: MeterSortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "id" || k === "buildingName" || k === "status" ? "asc" : "desc");
    }
  };

  const handleSubmit = async (input: MeterInput) => {
    const res = editing ? await updateMeter(editing.id, input) : await createMeter(input);
    if (res.ok) await load();
    return res;
  };

  if (!rows) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const online = rows.filter((m) => m.online).length;
  const silent = rows.length - online;
  const inactive = rows.filter((m) => m.status === "INACTIVE").length;

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.meters.title" descKey="page.meters.desc" />
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="grad-emerald border-0 text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("meters.add")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("meters.kpi.total")} value={rows.length} icon={Gauge} tone="sky" />
        <KpiCard label={t("meters.kpi.online")} value={online} icon={Signal} tone="emerald" />
        <KpiCard
          label={t("meters.kpi.silent")}
          value={silent}
          icon={WifiOff}
          tone="rose"
          hint={fill(t("meters.kpi.silentHint"), { h: SILENT_AFTER_HOURS })}
        />
        <KpiCard label={t("meters.kpi.inactive")} value={inactive} icon={PowerOff} tone="amber" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("meters.search")}
                className="pl-9"
              />
            </div>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              aria-label={t("table.building")}
              className={selectClass}
            >
              <option value="ALL">{t("meters.filter.allBuildings")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label={t("table.status")}
              className={selectClass}
            >
              <option value="ALL">{t("meters.filter.allStatus")}</option>
              <option value="ACTIVE">{t("meter.status.ACTIVE")}</option>
              <option value="INACTIVE">{t("meter.status.INACTIVE")}</option>
              <option value="SILENT">{t("meters.filter.silent")}</option>
            </select>
            <span className="text-sm text-muted-foreground">{fill(t("meters.resultCount"), { n: visible.length })}</span>
          </div>

          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("meters.empty")}</p>
          ) : (
            <>
              <MetersTable
                rows={pageRows}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                canEdit={isAdmin}
                onEdit={(m) => {
                  setEditing(m);
                  setFormOpen(true);
                }}
              />
              <Pagination page={current} pageCount={pageCount} onChange={setPage} />
            </>
          )}

          {isAdmin && <p className="text-xs text-muted-foreground">{t("meters.demoNote")}</p>}
        </CardContent>
      </Card>

      {isAdmin && (
        <MeterFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          meter={editing}
          buildings={buildings}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
