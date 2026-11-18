"use client";

import { Clock, Database, Gauge, Radio, Server, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/context/LanguageContext";
import type { getSystemHealth } from "@/services/dashboard";

type Health = Awaited<ReturnType<typeof getSystemHealth>>;

export function SilentMetersAlert({ health }: { health: Health }) {
  const { t } = useI18n();
  if (health.silent.length === 0) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300"
    >
      <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{t("dash.health.silentAlert")}</p>
        <p className="text-sm">{health.silent.map((s) => s.meterId).join(", ")}</p>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <Icon className={`mb-2 h-5 w-5 ${danger ? "text-rose-500" : "text-primary"}`} />
      <p className={`text-2xl font-bold ${danger ? "text-rose-500" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function SystemHealthCard({ health }: { health: Health }) {
  const { t, locale } = useI18n();
  const dot = (ok: boolean) => (
    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
  );
  const last = new Date(health.lastMeasurementTs).toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dash.health.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile icon={Gauge} label={t("dash.health.transmitting")} value={`${health.transmitting} / ${health.total}`} />
          <Tile
            icon={WifiOff}
            label={t("dash.health.silent")}
            value={String(health.silent.length)}
            danger={health.silent.length > 0}
          />
          <Tile icon={Radio} label={t("dash.health.ingestionRate")} value={`${health.ingestionRate} %`} />
          <Tile
            icon={Database}
            label={t("dash.health.ingested24h")}
            value={health.ingested24h.toLocaleString(locale)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Row icon={Clock} label={t("dash.health.lastMeasurement")}>
            {last} UTC
          </Row>
          <Row icon={Server} label={t("dash.health.api")}>
            {dot(health.api.ok)}
            {t("dash.health.online")} · {health.api.latencyMs} ms
          </Row>
          <Row icon={Database} label={t("dash.health.cassandra")}>
            {dot(health.cassandra.ok)}
            {t("dash.health.online")} · {health.cassandra.latencyMs} ms
          </Row>
        </div>

        <p className="text-xs text-muted-foreground">{t("dash.health.demoNote")}</p>
      </CardContent>
    </Card>
  );
}
