"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/context/LanguageContext";
import { fill } from "@/lib/format";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { BuildingStats, Result } from "@/services/buildings";

export function DeleteBuildingDialog({
  building,
  onClose,
  onConfirm,
}: {
  building: BuildingStats | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<Result<unknown>>;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
    setBusy(false);
  }, [building]);

  const confirm = async () => {
    if (!building) return;
    setBusy(true);
    setError(null);
    const res = await onConfirm(building.id);
    setBusy(false);
    if (res.ok) onClose();
    else setError(res.error);
  };

  return (
    <Dialog open={building !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("buildings.delete.title")}</DialogTitle>
          <DialogDescription>
            {building ? fill(t("buildings.delete.desc"), { name: building.name }) : ""}
          </DialogDescription>
        </DialogHeader>

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
          <Button type="button" variant="outline" onClick={onClose}>
            {t("buildings.form.cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={confirm}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("buildings.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
