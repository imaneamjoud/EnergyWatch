"use client";

import Link from "next/link";
import { Eye, Gauge, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortHead } from "@/components/common/SortHead";
import { useI18n } from "@/context/LanguageContext";
import { BUILDING_COLORS, FALLBACK_COLOR } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { MeterRow } from "@/services/meters";

export type MeterSortKey = "id" | "buildingName" | "status" | "lastTs" | "kwh7d" | "anomalyCount";

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

const statusKey = { ACTIVE: "meter.status.ACTIVE", INACTIVE: "meter.status.INACTIVE" } as const;

export function MetersTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  canEdit,
  onEdit,
}: {
  rows: MeterRow[];
  sortKey: MeterSortKey;
  sortDir: "asc" | "desc";
  onSort: (k: MeterSortKey) => void;
  canEdit: boolean;
  onEdit: (m: MeterRow) => void;
}) {
  const { t, locale } = useI18n();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHead label={t("table.meter")} k="id" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHead label={t("table.building")} k="buildingName" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHead label={t("table.status")} k="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <TableHead>{t("meters.col.transmission")}</TableHead>
          <SortHead label={t("table.lastMeasurement")} k="lastTs" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHead label={t("meters.col.kwh7d")} k="kwh7d" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <SortHead label={t("meters.col.anomalies")} k="anomalyCount" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <TableHead className="text-right">{t("meters.col.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((m) => (
          <TableRow key={m.id} className={cn(!m.online && "bg-rose-500/5")}>
            <TableCell>
              <Link href={`/meters/${m.id}`} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Gauge className="h-4 w-4 text-primary" />
                </span>
                <span>
                  <span className="block font-semibold">{m.id}</span>
                  <span className="block text-xs text-muted-foreground">{m.location || "—"}</span>
                </span>
              </Link>
            </TableCell>

            <TableCell>
              <span className="flex items-center gap-2">
                <span
                  className="h-5 w-1.5 rounded-full"
                  style={{ backgroundColor: BUILDING_COLORS[m.buildingId] ?? FALLBACK_COLOR }}
                />
                {m.buildingName}
              </span>
            </TableCell>

            <TableCell>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  m.status === "ACTIVE"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                )}
              >
                {t(statusKey[m.status])}
              </span>
            </TableCell>

            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <span className={cn("h-2 w-2 rounded-full", m.online ? "bg-emerald-500" : "animate-pulse bg-rose-500")} />
                {m.online ? t("meters.transmission.online") : t("meters.transmission.silent")}
              </span>
            </TableCell>

            <TableCell>
              {m.lastTs ? (
                <>
                  <span className="block">{fmt(m.lastTs)}</span>
                  <span className="block text-xs text-muted-foreground">{m.lastKwh} kWh</span>
                </>
              ) : (
                "—"
              )}
            </TableCell>

            <TableCell>{Math.round(m.kwh7d).toLocaleString(locale)} kWh</TableCell>

            <TableCell>
              <Badge variant={m.openAnomalies > 0 ? "destructive" : "secondary"}>{m.anomalyCount}</Badge>
            </TableCell>

            <TableCell>
              <div className="flex justify-end gap-1">
                <Link href={`/meters/${m.id}`} className={iconBtn} aria-label={t("meters.view")} title={t("meters.view")}>
                  <Eye className="h-4 w-4" />
                </Link>
                {canEdit && (
                  <button
                    type="button"
                    className={iconBtn}
                    aria-label={t("meters.edit")}
                    title={t("meters.edit")}
                    onClick={() => onEdit(m)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
