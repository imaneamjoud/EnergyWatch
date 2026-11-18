"use client";

import Link from "next/link";
import { Building2, Check, Gauge, LogIn, SlidersHorizontal, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/context/LanguageContext";
import type { ActivityType } from "@/services/dashboard";

const activityKey = {
  login: "activity.login",
  threshold: "activity.threshold",
  meter: "activity.meter",
  user: "activity.user",
  anomaly: "activity.anomaly",
} as const;

const activityIcon = {
  login: LogIn,
  threshold: SlidersHorizontal,
  meter: Gauge,
  user: UserPlus,
  anomaly: Check,
};

export function QuickActionsCard() {
  const { t } = useI18n();
  const actions = [
    { href: "/buildings", label: t("dash.admin.addBuilding"), icon: Building2, grad: "grad-emerald" },
    { href: "/meters", label: t("dash.admin.addMeter"), icon: Gauge, grad: "grad-sky" },
    { href: "/users", label: t("dash.admin.addUser"), icon: UserPlus, grad: "grad-amber" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dash.admin.quickActions")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <span className={`${a.grad} flex h-8 w-8 items-center justify-center rounded-lg`}>
              <a.icon className="h-4 w-4 text-white" />
            </span>
            {a.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function ActivityCard({
  items,
}: {
  items: { id: string; type: ActivityType; actor: string; ts: string }[];
}) {
  const { t, locale } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dash.admin.activity")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((e) => {
            const Icon = activityIcon[e.type];
            return (
              <li key={e.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                <div>
                  <p className="font-medium">{t(activityKey[e.type])}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.actor} ·{" "}
                    {new Date(e.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
