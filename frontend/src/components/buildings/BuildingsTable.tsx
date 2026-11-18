"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/context/LanguageContext";
import { typeKey, typeStyle } from "@/lib/buildingTypes";
import { BUILDING_COLORS, FALLBACK_COLOR } from "@/lib/config";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { BuildingStats } from "@/services/buildings";

export type SortKey = "name" | "type" | "meterCount" | "kwh7d" | "kwhPerM2" | "openAnomalies";
export type SortDir = "asc" | "desc";

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

function SortHead({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}

export function BuildingsTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  canEdit,
  onEdit,
  onDelete,
}: {
  rows: BuildingStats[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  canEdit: boolean;
  onEdit: (b: BuildingStats) => void;
  onDelete: (b: BuildingStats) => void;
}) {
  const { t, locale } = useI18n();
  const max = Math.max(1, ...rows.map((r) => r.kwh7d));
  const head = (key: TranslationKey, k: SortKey) => (
    <SortHead label={t(key)} k={k} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head("buildings.col.building", "name")}
          {head("buildings.col.type", "type")}
          {head("buildings.col.meters", "meterCount")}
          <TableHead>{t("buildings.col.surface")}</TableHead>
          {head("buildings.col.consumption", "kwh7d")}
          {head("buildings.col.intensity", "kwhPerM2")}
          {head("buildings.col.anomalies", "openAnomalies")}
          <TableHead className="text-right">{t("buildings.col.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((b) => (
          <TableRow key={b.id}>
            <TableCell>
              <Link href={`/buildings/${b.id}`} className="flex items-center gap-3">
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: BUILDING_COLORS[b.id] ?? FALLBACK_COLOR }}
                />
                <span>
                  <span className="block font-semibold">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">{b.address || "—"}</span>
                </span>
              </Link>
            </TableCell>

            <TableCell>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", typeStyle[b.type])}>
                {t(typeKey[b.type])}
              </span>
            </TableCell>

            <TableCell>
              <span className="font-medium">
                {b.activeMeters}/{b.meterCount}
              </span>
              {b.inactiveMeters > 0 && (
                <span className="ml-2 text-xs text-rose-500">
                  {fill(t("buildings.meters.inactive"), { n: b.inactiveMeters })}
                </span>
              )}
            </TableCell>

            <TableCell>{b.surfaceM2.toLocaleString(locale)} m²</TableCell>

            <TableCell className="min-w-[10rem]">
              <span className="font-medium">{Math.round(b.kwh7d).toLocaleString(locale)} kWh</span>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="grad-emerald h-full rounded-full" style={{ width: `${(b.kwh7d / max) * 100}%` }} />
              </div>
            </TableCell>

            <TableCell>{b.kwhPerM2.toLocaleString(locale, { maximumFractionDigits: 2 })}</TableCell>

            <TableCell>
              <Badge variant={b.openAnomalies > 0 ? "destructive" : "secondary"}>{b.openAnomalies}</Badge>
            </TableCell>

            <TableCell>
              <div className="flex justify-end gap-1">
                <Link href={`/buildings/${b.id}`} className={iconBtn} aria-label={t("buildings.view")} title={t("buildings.view")}>
                  <Eye className="h-4 w-4" />
                </Link>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      className={iconBtn}
                      aria-label={t("buildings.edit")}
                      title={t("buildings.edit")}
                      onClick={() => onEdit(b)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={cn(iconBtn, "hover:text-rose-500")}
                      aria-label={t("buildings.delete")}
                      title={t("buildings.delete")}
                      onClick={() => onDelete(b)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
