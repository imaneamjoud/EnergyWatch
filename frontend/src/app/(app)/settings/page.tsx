"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AlertCircle, Check, RotateCcw, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessDenied } from "@/components/common/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RuntimeSettings } from "@/lib/config";
import { cn } from "@/lib/utils";
import { getSettings, resetSettings, saveSettings } from "@/services/settings";
import type { TranslationKey } from "@/i18n/dictionaries";

type Form = Record<keyof RuntimeSettings, string>;

const toForm = (s: RuntimeSettings): Form => ({
  tariffPerKwh: String(s.tariffPerKwh),
  currency: s.currency,
  co2KgPerKwh: String(s.co2KgPerKwh),
  targetKwhPerMeter: String(s.targetKwhPerMeter),
  silentAfterHours: String(s.silentAfterHours),
  zThreshold: String(s.zThreshold),
  iqrFactor: String(s.iqrFactor),
  nightRatioPct: String(s.nightRatioPct),
  risingPct: String(s.risingPct),
});

const toSettings = (f: Form): RuntimeSettings => ({
  tariffPerKwh: Number(f.tariffPerKwh),
  currency: f.currency,
  co2KgPerKwh: Number(f.co2KgPerKwh),
  targetKwhPerMeter: Number(f.targetKwhPerMeter),
  silentAfterHours: Number(f.silentAfterHours),
  zThreshold: Number(f.zThreshold),
  iqrFactor: Number(f.iqrFactor),
  nightRatioPct: Number(f.nightRatioPct),
  risingPct: Number(f.risingPct),
});

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function NumberField({
  id, label, hint, value, onChange, min, max, step,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number | "any";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} required />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "ADMIN") return <AccessDenied />;
  return <SettingsContent />;
}

function SettingsContent() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; key: TranslationKey } | null>(null);

  useEffect(() => {
    getSettings().then((s) => setForm(toForm(s)));
  }, []);

  if (!form) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const set = (k: keyof RuntimeSettings) => (v: string) => {
    setForm({ ...form, [k]: v });
    setMsg(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveSettings(toSettings(form));
    if (res.ok) {
      setForm(toForm(res.data));
      setMsg({ ok: true, key: "set.saved" });
    } else setMsg({ ok: false, key: res.error });
  };

  const reset = async () => {
    setForm(toForm(await resetSettings()));
    setMsg({ ok: true, key: "set.resetDone" });
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.settings.title" descKey="page.settings.desc" />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("set.reset")}
          </Button>
          <Button type="submit" className="grad-emerald border-0 text-white hover:opacity-90">
            <Save className="mr-2 h-4 w-4" />
            {t("set.save")}
          </Button>
        </div>
      </div>

      {msg && (
        <div
          role={msg.ok ? "status" : "alert"}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-3 text-sm",
            msg.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          )}
        >
          {msg.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {t(msg.key)}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("set.energy.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <NumberField id="s-tariff" label={t("set.energy.tariff")} value={form.tariffPerKwh} onChange={set("tariffPerKwh")} min={0} step="any" />
            <div className="space-y-1.5">
              <Label htmlFor="s-currency">{t("set.energy.currency")}</Label>
              <select id="s-currency" value={form.currency} onChange={(e) => set("currency")(e.target.value)} className={selectClass}>
                {["EUR", "MAD", "USD"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <NumberField id="s-co2" label={t("set.energy.co2")} value={form.co2KgPerKwh} onChange={set("co2KgPerKwh")} min={0} step="any" />
            <NumberField id="s-target" label={t("set.energy.target")} value={form.targetKwhPerMeter} onChange={set("targetKwhPerMeter")} min={1} step="any" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("set.monitoring.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <NumberField id="s-silent" label={t("set.monitoring.silent")} value={form.silentAfterHours} onChange={set("silentAfterHours")} min={1} max={72} step={1} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("set.detection.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="s-z" label={t("set.detection.z")} hint={t("set.detection.zHint")} value={form.zThreshold} onChange={set("zThreshold")} min={1} max={10} step="any" />
              <NumberField id="s-iqr" label={t("set.detection.iqr")} hint={t("set.detection.iqrHint")} value={form.iqrFactor} onChange={set("iqrFactor")} min={0.5} max={5} step="any" />
            </div>
            <p className="text-xs text-muted-foreground">{t("set.detection.note")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("set.reco.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <NumberField id="s-night" label={t("set.reco.night")} value={form.nightRatioPct} onChange={set("nightRatioPct")} min={10} max={100} step="any" />
            <NumberField id="s-rising" label={t("set.reco.rising")} value={form.risingPct} onChange={set("risingPct")} min={1} max={100} step="any" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("set.prefs.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-lang">{t("set.prefs.language")}</Label>
              <select id="s-lang" value={lang} onChange={(e) => setLang(e.target.value as "fr" | "en")} className={selectClass}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-theme">{t("set.prefs.theme")}</Label>
              <select id="s-theme" value={theme ?? "system"} onChange={(e) => setTheme(e.target.value)} className={selectClass}>
                <option value="system">{t("set.theme.system")}</option>
                <option value="light">{t("set.theme.light")}</option>
                <option value="dark">{t("set.theme.dark")}</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">{t("set.demoNote")}</p>
    </form>
  );
}
