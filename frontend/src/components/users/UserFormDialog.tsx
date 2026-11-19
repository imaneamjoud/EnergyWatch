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
import type { TranslationKey } from "@/i18n/dictionaries";
import type { Result } from "@/services/buildings";
import type { UserInput } from "@/services/users";
import type { Building, Role, User } from "@/types";

const ROLES: Role[] = ["ADMIN", "ANALYST", "MANAGER"];
const roleKey = { ADMIN: "role.ADMIN", ANALYST: "role.ANALYST", MANAGER: "role.MANAGER" } as const;
const roleDescKey = {
  ADMIN: "usr.roleDesc.ADMIN",
  ANALYST: "usr.roleDesc.ANALYST",
  MANAGER: "usr.roleDesc.MANAGER",
} as const;

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  buildings,
  currentUserId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  buildings: Building[];
  currentUserId: string;
  onSubmit: (input: UserInput) => Promise<Result<unknown>>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MANAGER");
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "MANAGER");
    setBuildingIds(user?.buildingIds ?? []);
    setActive(user ? user.active !== false : true);
    setError(null);
    setSaving(false);
  }, [open, user]);

  const isSelf = user?.id === currentUserId;
  const editing = user !== null;

  const toggleBuilding = (id: string) =>
    setBuildingIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await onSubmit({ name, email, role, buildingIds, active });
    setSaving(false);
    if (res.ok) onOpenChange(false);
    else setError(res.error);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("usr.form.editTitle") : t("usr.form.addTitle")}</DialogTitle>
          <DialogDescription>{editing ? t("usr.form.editDesc") : t("usr.form.addDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">{t("usr.form.name")}</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-email">{t("usr.form.email")}</Label>
            <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-role">{t("usr.form.role")}</Label>
            <select
              id="u-role"
              value={role}
              disabled={isSelf}
              onChange={(e) => setRole(e.target.value as Role)}
              className={selectClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(roleKey[r])}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t(roleDescKey[role])}</p>
          </div>

          {role === "MANAGER" && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("usr.form.buildings")}</legend>
              <p className="text-xs text-muted-foreground">{t("usr.form.buildingsHint")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {buildings.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={buildingIds.includes(b.id)}
                      onChange={() => toggleBuilding(b.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              disabled={isSelf}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            {t("usr.form.active")}
          </label>

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
                t("usr.form.save")
              ) : (
                t("usr.form.create")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
