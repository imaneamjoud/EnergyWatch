"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { useI18n } from "@/context/LanguageContext";
import {
  anomalyRecoKey, anomalyStatusKey, severityKey, severityStyle, statusStyle,
} from "@/lib/anomalyReco";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAnomalyContext, type AnomalyRow } from "@/services/anomalies";
import type { AnomalyStatus } from "@/types";

type Ctx = Awaited<ReturnType<typeof getAnomalyContext>>;
const STATUSES: AnomalyStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"];

export function AnomalyDetailDialog({
  anomaly,
  onClose,
  canUpdate,
  onStatusChange,
}: {
  anomaly: AnomalyRow | null;
  onClose: () => void;
  canUpdate: boolean;
  onStatusChange: (id: string, status: AnomalyStatus) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [ctx, setCtx] = useState<Ctx | null>(null);

  useEffect(() => {
    setCtx(null);
    if (anomaly) getAnomalyContext(anomaly).then(setCtx);
  }, [anomaly?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTick = (ts: number) =>
    new Date(ts).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", timeZone: "UTC" });

  return (
    <Dialog open={anomaly !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {anomaly && (
          <>
            <DialogHeader>
              <DialogTitle>{fill(t("anom.detail.title"), { id: anomaly.id })}</DialogTitle>
              <DialogDescription>{t("anom.detail.desc")}</DialogDescription>
            </DialogHeader>

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.meter")}</dt>
                <dd className="font-medium">
                  <Link href={`/meters/${anomaly.meterId}`} className="hover:underline">
                    {anomaly.meterId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.building")}</dt>
                <dd className="font-medium">{anomaly.buildingName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.when")}</dt>
                <dd className="font-medium">
                  {new Date(anomaly.timestamp).toLocaleString(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.method")}</dt>
                <dd className="font-medium">{anomaly.method}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.recorded")}</dt>
                <dd className="font-semibold text-rose-500">{anomaly.kwh} kWh</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.usual")}</dt>
                <dd className="font-medium">{anomaly.expectedKwh} kWh</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.deviation")}</dt>
                <dd className="font-medium">
                  {anomaly.deviationPct > 0 ? "+" : ""}
                  {anomaly.deviationPct.toLocaleString(locale)} % (x{anomaly.ratio.toLocaleString(locale)})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("anom.detail.severity")}</dt>
                <dd>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", severityStyle[anomaly.severity])}>
                    {t(severityKey[anomaly.severity])}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="rounded-xl border bg-muted/40 p-3 text-sm">
              <p className="mb-1 font-medium">{t("anom.detail.recommendation")}</p>
              <p className="text-muted-foreground">{t(anomalyRecoKey(anomaly))}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("anom.detail.status")}</p>
              {canUpdate ? (
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={anomaly.status === s}
                      onClick={() => anomaly.status !== s && onStatusChange(anomaly.id, s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                        anomaly.status === s
                          ? cn("border-transparent", statusStyle[s])
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(anomalyStatusKey[s])}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusStyle[anomaly.status])}>
                    {t(anomalyStatusKey[anomaly.status])}
                  </span>
                  <p className="text-xs text-muted-foreground">{t("anom.detail.readOnly")}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("anom.detail.context")}</p>
              {ctx && ctx.data.length > 0 ? (
                <TimeSeriesChart data={ctx.data} anomalies={ctx.marks} formatTick={formatTick} locale={locale} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
