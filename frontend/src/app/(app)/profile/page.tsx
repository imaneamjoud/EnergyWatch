"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AlertCircle, Building2, Check, Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fill } from "@/lib/format";
import { navigation } from "@/lib/navigation";
import { initials } from "@/lib/user";
import { cn } from "@/lib/utils";
import { changePassword, updateProfile } from "@/services/account";
import { getBuildings } from "@/services/energy";
import type { Lang, TranslationKey } from "@/i18n/dictionaries";
import type { Building, Role, User } from "@/types";

type Msg = { ok: boolean; key: TranslationKey } | null;

const roleKey = { ADMIN: "role.ADMIN", ANALYST: "role.ANALYST", MANAGER: "role.MANAGER" } as const;
const roleDescKey = {
  ADMIN: "usr.roleDesc.ADMIN",
  ANALYST: "usr.roleDesc.ANALYST",
  MANAGER: "usr.roleDesc.MANAGER",
} as const;
const roleStyle: Record<Role, string> = {
  ADMIN: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  ANALYST: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  MANAGER: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};
const selectClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

// 1 = faible, 2 = moyenne, 3 = forte
function strengthLevel(p: string): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  let points = 0;
  if (p.length >= 8) points++;
  if (p.length >= 12) points++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) points++;
  if (/\d/.test(p)) points++;
  if (/[^A-Za-z0-9]/.test(p)) points++;
  if (p.length < 8) return 1;
  return points >= 5 ? 3 : points >= 3 ? 2 : 1;
}

function Message({ msg }: { msg: Msg }) {
  const { t } = useI18n();
  if (!msg) return null;
  return (
    <div role={msg.ok ? "status" : "alert"} className={cn("ei-msg", msg.ok ? "ei-msg-ok" : "ei-msg-err")}>
      {msg.ok ? <Check size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
      {t(msg.key)}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  const { t } = useI18n();
  return (
    <div className="ei-group">
      <label htmlFor={id} className="ei-label">
        {label}
      </label>
      <div className="ei-passwrap">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          required
        />
        <button
          type="button"
          className="ei-passtoggle"
          onClick={onToggle}
          aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
        >
          {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateSession } = useAuth();
  if (!user) return null;
  return <ProfileContent user={user} updateSession={updateSession} />;
}

function ProfileContent({ user, updateSession }: { user: User; updateSession: (u: User) => void }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [infoMsg, setInfoMsg] = useState<Msg>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<Msg>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  useEffect(() => {
    getBuildings(user.buildingIds).then(setBuildings);
  }, [user.buildingIds]);

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg(null);
    const res = await updateProfile(user.id, { name, email });
    if (res.ok) {
      updateSession(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setInfoMsg({ ok: true, key: "prof.saved" });
    } else setInfoMsg({ ok: false, key: res.error });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const res = await changePassword(user.id, current, next, confirm);
    if (res.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setPwdMsg({ ok: true, key: "prof.pwd.saved" });
    } else setPwdMsg({ ok: false, key: res.error });
  };

  const level = strengthLevel(next);
  const strengthKey = (["prof.strength.1", "prof.strength.1", "prof.strength.2", "prof.strength.3"] as const)[level];
  const pages = navigation.flatMap((s) => s.items).filter((i) => i.roles.includes(user.role)).length + 1;

  return (
    <div className="ei-page">
      <PageHeader titleKey="page.profile.title" descKey="page.profile.desc" />

      <section className="ei-hero">
        <span className="ei-avatar">{initials(user.name)}</span>
        <div className="ei-hero-main">
          <span className="ei-hero-name">{user.name}</span>
          <span className="ei-hero-mail">{user.email}</span>
          <div className="ei-chips">
            <span className={cn("ei-chip", roleStyle[user.role])}>{t(roleKey[user.role])}</span>
            {user.role === "MANAGER" &&
              buildings.map((b) => (
                <span key={b.id} className="ei-chip bg-muted text-foreground">
                  <Building2 size={12} aria-hidden="true" />
                  {b.name}
                </span>
              ))}
          </div>
        </div>
      </section>

      <div className="ei-grid2">
        <form onSubmit={saveInfo} className="ei-panel">
          <div>
            <h3 className="ei-panel-title">{t("prof.info.title")}</h3>
            <p className="ei-panel-desc">{t("prof.info.desc")}</p>
          </div>
          <div className="ei-form">
            <div className="ei-group">
              <label htmlFor="p-name" className="ei-label">
                {t("usr.form.name")}
              </label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
            <div className="ei-group">
              <label htmlFor="p-email" className="ei-label">
                {t("usr.form.email")}
              </label>
              <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <Message msg={infoMsg} />
            <div>
              <Button type="submit" className="grad-emerald border-0 text-white hover:opacity-90">
                <Save className="mr-2 h-4 w-4" />
                {t("prof.save")}
              </Button>
            </div>
          </div>
        </form>

        <form onSubmit={savePassword} className="ei-panel">
          <div>
            <h3 className="ei-panel-title">{t("prof.pwd.title")}</h3>
            <p className="ei-panel-desc">{t("prof.pwd.desc")}</p>
          </div>
          <div className="ei-form">
            <PasswordField id="p-current" label={t("prof.pwd.current")} value={current} onChange={setCurrent} show={showPwd} onToggle={() => setShowPwd((s) => !s)} autoComplete="current-password" />
            <PasswordField id="p-new" label={t("prof.pwd.new")} value={next} onChange={setNext} show={showPwd} onToggle={() => setShowPwd((s) => !s)} autoComplete="new-password" />
            {level > 0 && (
              <div className="ei-group">
                <div className="ei-strength" data-level={level} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="ei-label">
                  {t("prof.strength")} : {t(strengthKey)}
                </span>
              </div>
            )}
            <PasswordField id="p-confirm" label={t("prof.pwd.confirm")} value={confirm} onChange={setConfirm} show={showPwd} onToggle={() => setShowPwd((s) => !s)} autoComplete="new-password" />
            <Message msg={pwdMsg} />
            <div>
              <Button type="submit" variant="outline">
                <KeyRound className="mr-2 h-4 w-4" />
                {t("prof.pwd.submit")}
              </Button>
            </div>
          </div>
        </form>

        <section className="ei-panel">
          <h3 className="ei-panel-title">{t("set.prefs.title")}</h3>
          <div className="ei-form">
            <div className="ei-group">
              <label htmlFor="p-lang" className="ei-label">
                {t("set.prefs.language")}
              </label>
              <select id="p-lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={selectClass}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="ei-group">
              <label htmlFor="p-theme" className="ei-label">
                {t("set.prefs.theme")}
              </label>
              <select id="p-theme" value={theme ?? "system"} onChange={(e) => setTheme(e.target.value)} className={selectClass}>
                <option value="system">{t("set.theme.system")}</option>
                <option value="light">{t("set.theme.light")}</option>
                <option value="dark">{t("set.theme.dark")}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="ei-panel">
          <h3 className="ei-panel-title">{t("prof.account.title")}</h3>
          <dl className="ei-facts">
            <div className="ei-fact">
              <dt>{t("prof.account.role")}</dt>
              <dd>{t(roleKey[user.role])}</dd>
            </div>
            <div className="ei-fact">
              <dt>{t("prof.account.access")}</dt>
              <dd>{t(roleDescKey[user.role])}</dd>
            </div>
            <div className="ei-fact">
              <dt>{t("prof.account.scope")}</dt>
              <dd>
                {user.role === "MANAGER"
                  ? buildings.map((b) => b.name).join(", ") || t("usr.noBuilding")
                  : t("usr.allBuildings")}
              </dd>
            </div>
            <div className="ei-fact">
              <dt>{t("nav.menuTitle")}</dt>
              <dd>{fill(t("prof.account.pages"), { n: pages })}</dd>
            </div>
          </dl>
        </section>
      </div>

      <p className="text-xs text-muted-foreground">{t("prof.demoNote")}</p>
    </div>
  );
}
