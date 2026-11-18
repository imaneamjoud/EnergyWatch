"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { EnergyIllustration } from "@/components/auth/EnergyIllustration";
import { DEMO_PASSWORD, demoUsers } from "@/mocks/users";

const roleKey = {
  ADMIN: "role.ADMIN",
  ANALYST: "role.ANALYST",
  MANAGER: "role.MANAGER",
} as const;

const roleStyle = {
  ADMIN: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  ANALYST: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  MANAGER: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
} as const;

const demoAccounts = demoUsers.filter((u) => ["u1", "u2", "u3", "u4"].includes(u.id));

function Field({
  id,
  label,
  right,
  children,
}: {
  id: string;
  label: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[11px] font-medium text-muted-foreground">
          {label}
        </label>
        {children}
      </div>
      {right}
    </div>
  );
}

const inputClass =
  "w-full bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFailed(false);
    if (login(email.trim(), password, remember)) {
      setSubmitting(true);
      router.push("/dashboard");
    } else {
      setFailed(true);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFailed(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f1e7] p-4 dark:bg-background sm:p-8">
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border-2 border-emerald-950/80 bg-card shadow-2xl dark:border-emerald-400/30 lg:min-h-[660px] lg:grid-cols-2">
        {/* Formulaire */}
        <div className="flex flex-col justify-between gap-8 p-8 sm:p-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grad-emerald flex h-10 w-10 items-center justify-center rounded-xl shadow-md shadow-emerald-500/30">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-brand-gradient text-xl font-bold">EnergyInsight</span>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950 dark:text-foreground">
                {t("auth.welcome")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("auth.welcomeSub")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field id="email" label={t("login.email")}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>

              <Field
                id="password"
                label={t("login.password")}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-600"
                  />
                  {t("auth.remember")}
                </label>
                <button type="button" className="font-medium text-rose-500 hover:underline">
                  {t("login.forgot")}
                </button>
              </div>

              {failed && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t("login.error")}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 flex-1 bg-emerald-700 text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-800"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.signingIn")}
                    </>
                  ) : (
                    t("login.submit")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={showDemo}
                  onClick={() => setShowDemo((s) => !s)}
                  className="h-11 flex-1 border-emerald-700/40 text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300"
                >
                  {t("auth.demoButton")}
                </Button>
              </div>
            </form>

            {showDemo && (
              <div className="space-y-3 rounded-2xl border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{t("auth.demoHint")}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {demoAccounts.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => fillDemo(u.email)}
                      className="rounded-xl border bg-card p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
                    >
                      <span
                        className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleStyle[u.role]}`}
                      >
                        {t(roleKey[u.role])}
                      </span>
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="max-w-sm text-xs text-muted-foreground">{t("auth.terms")}</p>
        </div>

        {/* Illustration */}
        <div className="relative hidden min-h-[660px] lg:block">
          <EnergyIllustration label={t("auth.illustrationAlt")} />
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-full bg-card/85 p-1 shadow-lg backdrop-blur">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Pastille centrale (décorative) */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-20 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-400 text-emerald-950 shadow-lg ring-4 ring-white/40 lg:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
