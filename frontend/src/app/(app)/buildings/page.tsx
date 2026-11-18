"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Gauge, Plus, Ruler, Search, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BuildingsTable, type SortDir, type SortKey } from "@/components/buildings/BuildingsTable";
import { BuildingFormDialog } from "@/components/buildings/BuildingFormDialog";
import { DeleteBuildingDialog } from "@/components/buildings/DeleteBuildingDialog";
import { BUILDING_TYPES, typeKey } from "@/lib/buildingTypes";
import { fill } from "@/lib/format";
import {
  createBuilding, deleteBuilding, getBuildingStats, updateBuilding,
  type BuildingInput, type BuildingStats,
} from "@/services/buildings";
import type { BuildingType } from "@/types";

export default function BuildingsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAdmin = user?.role === "ADMIN";

  const [rows, setRows] = useState<BuildingStats[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<BuildingType | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BuildingStats | null>(null);
  const [deleting, setDeleting] = useState<BuildingStats | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setRows(await getBuildingStats(user.buildingIds));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (rows ?? []).filter(
      (b) =>
        (typeFilter === "ALL" || b.type === typeFilter) &&
        (!q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q))
    );
    return [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp =
        typeof va === "string" && typeof vb === "string" ? va.localeCompare(vb, locale) : Number(va) - Number(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, search, typeFilter, sortKey, sortDir, locale]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "name" || k === "type" ? "asc" : "desc");
    }
  };

  const handleSubmit = async (input: BuildingInput) => {
    const res = editing ? await updateBuilding(editing.id, input) : await createBuilding(input);
    if (res.ok) await load();
    return res;
  };

  const handleDelete = async (id: string) => {
    const res = await deleteBuilding(id);
    if (res.ok) await load();
    return res;
  };

  if (!rows) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const totalSurface = rows.reduce((s, b) => s + b.surfaceM2, 0);
  const totalMeters = rows.reduce((s, b) => s + b.meterCount, 0);
  const activeMeters = rows.reduce((s, b) => s + b.activeMeters, 0);
  const totalKwh = rows.reduce((s, b) => s + b.kwh7d, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.buildings.title" descKey="page.buildings.desc" />
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="grad-emerald border-0 text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("buildings.add")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("buildings.kpi.total")} value={rows.length} icon={Building2} tone="emerald" />
        <KpiCard label={t("buildings.kpi.surface")} value={totalSurface} unit="m²" icon={Ruler} tone="sky" />
        <KpiCard
          label={t("buildings.kpi.meters")}
          value={totalMeters}
          icon={Gauge}
          tone="amber"
          hint={fill(t("buildings.kpi.metersHint"), { active: activeMeters, total: totalMeters })}
        />
        <KpiCard
          label={t("buildings.kpi.consumption")}
          value={Math.round(totalKwh)}
          unit="kWh"
          icon={Zap}
          tone="rose"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("buildings.search")}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as BuildingType | "ALL")}
              aria-label={t("buildings.col.type")}
              className="h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="ALL">{t("buildings.filter.all")}</option>
              {BUILDING_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {t(typeKey[bt])}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">
              {fill(t("buildings.resultCount"), { n: visible.length })}
            </span>
          </div>

          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("buildings.empty")}</p>
          ) : (
            <BuildingsTable
              rows={visible}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              canEdit={isAdmin}
              onEdit={(b) => {
                setEditing(b);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          )}

          {isAdmin && <p className="text-xs text-muted-foreground">{t("buildings.demoNote")}</p>}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <BuildingFormDialog open={formOpen} onOpenChange={setFormOpen} building={editing} onSubmit={handleSubmit} />
          <DeleteBuildingDialog building={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
        </>
      )}
    </div>
  );
}
