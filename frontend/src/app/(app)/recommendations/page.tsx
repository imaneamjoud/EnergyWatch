"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, AlertTriangle, Building2, Check, CheckCircle2, Lightbulb, Moon, TrendingUp, Undo2, WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/format";
import { priorityKey, priorityStyle, recoText } from "@/lib/reco";
import { cn } from "@/lib/utils";
import { getBuildings } from "@/services/energy";
import {
  getRecommendations, setRecommendationDone, type Priority, type Recommendation, type RecoType,
} from "@/services/recommendations";
import type { Building } from "@/types";

const ICONS: Record<RecoType, LucideIcon> = {
  SILENT_METER: WifiOff,
  OPEN_ANOMALIES: AlertTriangle,
  NIGHT_LOAD: Moon,
  RISING: TrendingUp,
  STABLE: CheckCircle2,
};
const selectClass =
  "h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [rows, setRows] = useState<Recommendation[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "DONE">("ALL");

  const load = useCallback(async () => {
    if (!user) return;
    const [r, b] = await Promise.all([getRecommendations(user.buildingIds), getBuildings(user.buildingIds)]);
    setRows(r);
    setBuildings(b);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (buildingFilter === "ALL" || r.buildingId === buildingFilter) &&
          (priorityFilter === "ALL" || r.priority === priorityFilter) &&
          (statusFilter === "ALL" || (statusFilter === "DONE" ? r.done : !r.done))
      ),
    [rows, buildingFilter, priorityFilter, statusFilter]
  );

  const toggle = async (r: Recommendation) => {
    await setRecommendationDone(r.id, !r.done);
    await load();
  };

  if (!rows) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const open = rows.filter((r) => !r.done);
  const high = open.filter((r) => r.priority === "HIGH").length;

  return (
    <div className="ei-page">
      <PageHeader titleKey="page.recommendations.title" descKey="page.recommendations.desc" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("reco.kpi.total")} value={rows.length} icon={Lightbulb} tone="sky" />
        <KpiCard label={t("reco.kpi.open")} value={open.length} icon={AlertCircle} tone="amber" />
        <KpiCard label={t("reco.kpi.high")} value={high} icon={AlertTriangle} tone="rose" />
        <KpiCard label={t("reco.kpi.done")} value={rows.length - open.length} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="ei-toolbar">
        <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} aria-label={t("table.building")} className={selectClass}>
          <option value="ALL">{t("reco.filter.allBuildings")}</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | "ALL")} aria-label={t("table.severity")} className={selectClass}>
          <option value="ALL">{t("reco.filter.allPriority")}</option>
          {(["HIGH", "MEDIUM", "LOW", "INFO"] as const).map((p) => (
            <option key={p} value={p}>{t(priorityKey[p])}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | "OPEN" | "DONE")} aria-label={t("table.status")} className={selectClass}>
          <option value="ALL">{t("reco.filter.allStatus")}</option>
          <option value="OPEN">{t("reco.status.open")}</option>
          <option value="DONE">{t("reco.status.done")}</option>
        </select>
        <span className="text-sm text-muted-foreground">{fill(t("reco.resultCount"), { n: visible.length })}</span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">{t("reco.empty")}</p>
      ) : (
        <div className="ei-list">
          {visible.map((r) => {
            const Icon = ICONS[r.type];
            const tx = recoText(r, t);
            return (
              <article key={r.id} className={cn("reco-card", r.done && "reco-done")}>
                <span className={cn("reco-icon", priorityStyle[r.priority])}>
                  <Icon size={22} aria-hidden="true" />
                </span>

                <div className="reco-body">
                  <div className="reco-head">
                    <h3 className="reco-title">{tx.title}</h3>
                    <span className={cn("ei-chip", priorityStyle[r.priority])}>{t(priorityKey[r.priority])}</span>
                    {r.done && (
                      <span className="ei-chip ei-chip-done">
                        <Check size={12} aria-hidden="true" />
                        {t("reco.status.done")}
                      </span>
                    )}
                  </div>

                  <p className="reco-desc">{tx.desc}</p>

                  <p className="reco-action">
                    <strong>{t("reco.action")}</strong> {tx.action}
                  </p>

                  <div className="reco-foot">
                    <span className="reco-building">
                      <Building2 size={14} aria-hidden="true" />
                      {r.buildingName}
                    </span>
                    <Button
                      variant={r.done ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggle(r)}
                      className={cn(!r.done && "grad-emerald border-0 text-white hover:opacity-90")}
                    >
                      {r.done ? <Undo2 className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                      {r.done ? t("reco.undo") : t("reco.markDone")}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("reco.note")}</p>
    </div>
  );
}
