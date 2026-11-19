"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/context/LanguageContext";
import { fill } from "@/lib/format";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { Result } from "@/services/buildings";
import type { MeterInput, MeterRow } from "@/services/meters";
import type { Building, MeterStatus } from "@/types";

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const STATUSES: MeterStatus[] = ["ACTIVE", "INACTIVE"];
const statusKey = { ACTIVE: "meter.status.ACTIVE", INACTIVE: "meter.status.INACTIVE" } as const;

export function MeterFormDialog({
  open,
  onOpenChange,
  meter,
  buildings,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meter: MeterRow | null;
  buildings: Building[];
  onSubmit: (input: MeterInput) => Promise<Result<unknown>>;
}) {
  const { t } = useI18n();
  const [buildingId, setBuildingId] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<MeterStatus>("ACTIVE");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBuildingId(meter?.buildingId ?? buildings[0]?.id ?? "");
    setLocation(meter?.location ?? "");
    setStatus(meter?.status ?? "ACTIVE");
    setError(null);
    setSaving(false);
  }, [open, meter, buildings]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await onSubmit({ buildingId, location, status });
    setSaving(false);
    if (res.ok) onOpenChange(false);
    else setError(res.error);
  };

  const editing = meter !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("meters.form.editTitle") : t("meters.form.addTitle")}</DialogTitle>
          <DialogDescription>
            {editing ? fill(t("meters.form.editDesc"), { id: meter.id }) : t("meters.form.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-building">{t("meters.form.building")}</Label>
            <select
              id="m-building"
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className={selectClass}
              required
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-location">{t("meters.form.location")}</Label>
            <Input id="m-location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-status">{t("meters.form.status")}</Label>
            <select
              id="m-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MeterStatus)}
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(statusKey[s])}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t(error)}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("buildings.form.cancel")}
            </Button>
            <Button type="submit" disabled={saving} className="grad-emerald border-0 text-white hover:opacity-90">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("buildings.form.saving")}
                </>
              ) : editing ? (
                t("meters.form.save")
              ) : (
                t("meters.form.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
