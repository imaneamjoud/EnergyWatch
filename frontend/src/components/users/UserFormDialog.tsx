"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/context/LanguageContext";
import { fill } from "@/lib/format";
import { generatePassword, strengthLevel } from "@/lib/password";
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
const strengthKey = ["prof.strength.1", "prof.strength.1", "prof.strength.2", "prof.strength.3"] as const;

const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

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
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState<"pwd" | "all" | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "MANAGER");
    setBuildingIds(user?.buildingIds ?? []);
    setActive(user ? user.active !== false : true);
    setPassword("");
    setShowPwd(false);
    setCopied(null);
    setError(null);
    setSaving(false);
    setCreated(null);
  }, [open, user]);

  const isSelf = user?.id === currentUserId;
  const editing = user !== null;
  const level = strengthLevel(password);

  const toggleBuilding = (id: string) =>
    setBuildingIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const flash = (what: "pwd" | "all") => {
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  };

  const generate = () => {
    setPassword(generatePassword());
    setShowPwd(true);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await onSubmit({ name, email, role, buildingIds, active, password });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (editing) onOpenChange(false);
    else setCreated({ name: name.trim(), email: email.trim(), password });
  };

  if (created) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("usr.created.title")}</DialogTitle>
            <DialogDescription>{fill(t("usr.created.desc"), { name: created.name })}</DialogDescription>
          </DialogHeader>

          <dl className="ei-facts rounded-xl border bg-muted/40 p-4">
            <div className="ei-fact">
              <dt>{t("usr.created.email")}</dt>
              <dd>{created.email}</dd>
            </div>
            <div className="ei-fact">
              <dt>{t("usr.created.password")}</dt>
              <dd style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{created.password}</dd>
            </div>
          </dl>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (await copyText(`${created.email}\n${created.password}`)) flash("all");
              }}
            >
              {copied === "all" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied === "all" ? t("usr.form.copied") : t("usr.created.copyAll")}
            </Button>
            <Button type="button" className="grad-emerald border-0 text-white hover:opacity-90" onClick={() => onOpenChange(false)}>
              {t("usr.created.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("usr.form.editTitle") : t("usr.form.addTitle")}</DialogTitle>
          <DialogDescription>{editing ? t("usr.form.editDesc") : t("usr.form.addDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="ei-form">
          <div className="ei-group">
            <label htmlFor="u-name" className="ei-label">
              {t("usr.form.name")}
            </label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
          </div>

          <div className="ei-group">
            <label htmlFor="u-email" className="ei-label">
              {t("usr.form.email")}
            </label>
            <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
          </div>

          <div className="ei-group">
            <label htmlFor="u-password" className="ei-label">
              {editing ? t("usr.form.passwordReset") : t("usr.form.password")}
            </label>
            <div className="ei-passwrap">
              <Input
                id="u-password"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required={!editing}
              />
              <button
                type="button"
                className="ei-passtoggle"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>

            {level > 0 && (
              <>
                <div className="ei-strength" data-level={level} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="ei-label">
                  {t("prof.strength")} : {t(strengthKey[level])}
                </span>
              </>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={generate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("usr.form.generate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!password}
                onClick={async () => {
                  if (await copyText(password)) flash("pwd");
                }}
              >
                {copied === "pwd" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied === "pwd" ? t("usr.form.copied") : t("usr.form.copy")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {editing ? t("usr.form.passwordHintEdit") : t("usr.form.passwordHintCreate")}
            </p>
          </div>

          <div className="ei-group">
            <label htmlFor="u-role" className="ei-label">
              {t("usr.form.role")}
            </label>
            <select id="u-role" value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value as Role)} className={selectClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(roleKey[r])}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t(roleDescKey[role])}</p>
          </div>

          {role === "MANAGER" && (
            <fieldset className="ei-group">
              <legend className="ei-label">{t("usr.form.buildings")}</legend>
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
            <div role="alert" className="ei-msg ei-msg-err">
              <AlertCircle size={16} aria-hidden="true" />
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
