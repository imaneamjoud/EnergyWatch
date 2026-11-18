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
import { BUILDING_TYPES, typeKey } from "@/lib/buildingTypes";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { BuildingInput, BuildingStats, Result } from "@/services/buildings";
import type { BuildingType } from "@/types";

export function BuildingFormDialog({
  open,
  onOpenChange,
  building,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: BuildingStats | null;
  onSubmit: (input: BuildingInput) => Promise<Result<unknown>>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [type, setType] = useState<BuildingType>("OFFICE");
  const [address, setAddress] = useState("");
  const [surface, setSurface] = useState("");
  const [floors, setFloors] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(building?.name ?? "");
    setType(building?.type ?? "OFFICE");
    setAddress(building?.address ?? "");
    setSurface(building ? String(building.surfaceM2) : "");
    setFloors(building ? String(building.floors) : "");
    setError(null);
    setSaving(false);
  }, [open, building]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await onSubmit({
      name,
      type,
      address,
      surfaceM2: Number(surface),
      floors: Number(floors),
    });
    setSaving(false);
    if (res.ok) onOpenChange(false);
    else setError(res.error);
  };

  const editing = building !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("buildings.form.editTitle") : t("buildings.form.addTitle")}</DialogTitle>
          <DialogDescription>
            {editing ? t("buildings.form.editDesc") : t("buildings.form.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="b-name">{t("buildings.form.name")}</Label>
            <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="b-type">{t("buildings.form.type")}</Label>
            <select
              id="b-type"
              value={type}
              onChange={(e) => setType(e.target.value as BuildingType)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {BUILDING_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {t(typeKey[bt])}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="b-address">{t("buildings.form.address")}</Label>
            <Input id="b-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="b-surface">{t("buildings.form.surface")}</Label>
              <Input
                id="b-surface"
                type="number"
                min="1"
                step="any"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-floors">{t("buildings.form.floors")}</Label>
              <Input
                id="b-floors"
                type="number"
                min="1"
                step="1"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                required
              />
            </div>
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
                t("buildings.form.save")
              ) : (
                t("buildings.form.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
