"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/context/LanguageContext";
import type { getAnomalyOverview } from "@/services/dashboard";
import type { Anomaly, AnomalyStatus, Severity } from "@/types";

type Overview = Awaited<ReturnType<typeof getAnomalyOverview>>;

export const statusKey = {
  NEW: "status.NEW",
  IN_PROGRESS: "status.IN_PROGRESS",
  RESOLVED: "status.RESOLVED",
} as const;

const severityKey = {
  LOW: "severity.LOW",
  MEDIUM: "severity.MEDIUM",
  HIGH: "severity.HIGH",
} as const;

const severityStyle: Record<Severity, string> = {
  HIGH: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  MEDIUM: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  LOW: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

const statusBar: Record<AnomalyStatus, string> = {
  NEW: "bg-rose-500",
  IN_PROGRESS: "bg-amber-500",
  RESOLVED: "bg-emerald-500",
};

const STATUSES: AnomalyStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"];
const SEVERITIES: Severity[] = ["HIGH", "MEDIUM", "LOW"];

export function AnomalyOverviewCard({ overview }: { overview: Overview }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dash.admin.anomalyOverview")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("dash.admin.bySeverity")}</p>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((s) => (
              <div key={s} className={`rounded-xl p-3 text-center ${severityStyle[s]}`}>
                <p className="text-2xl font-bold">{overview.severity[s]}</p>
                <p className="text-xs">{t(severityKey[s])}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("dash.admin.byStatus")}</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {STATUSES.map((s) =>
              overview.status[s] > 0 ? (
                <div
                  key={s}
                  className={statusBar[s]}
                  style={{ width: `${(overview.status[s] / overview.total) * 100}%` }}
                />
              ) : null
            )}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusBar[s]}`} />
                  {t(statusKey[s])}
                </span>
                <span className="font-semibold">{overview.status[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function PriorityQueueCard({
  queue,
  buildingName,
  onStatusChange,
}: {
  queue: Anomaly[];
  buildingName: (id: string) => string;
  onStatusChange: (id: string, status: AnomalyStatus) => void;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dash.admin.priorityQueue")}</CardTitle>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dash.admin.noOpen")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.meter")}</TableHead>
                <TableHead>{t("table.building")}</TableHead>
                <TableHead>{t("table.severity")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.meterId}</TableCell>
                  <TableCell>{buildingName(a.buildingId)}</TableCell>
                  <TableCell>
                    <Badge variant={a.severity === "HIGH" ? "destructive" : "secondary"}>
                      {t(severityKey[a.severity])}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      value={a.status}
                      onChange={(e) => onStatusChange(a.id, e.target.value as AnomalyStatus)}
                      className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(statusKey[s])}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
