"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Lightbulb,
  Zap,
} from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/LanguageContext";

const chartValues = [42, 63, 51, 82, 59, 94, 72];
const peakIndex = 5; // the day flagged as an anomaly in the sample chart
const chartDays = [
  "home.day.mon",
  "home.day.tue",
  "home.day.wed",
  "home.day.thu",
  "home.day.fri",
  "home.day.sat",
  "home.day.sun",
] as const;

const featureCards = [
  {
    id: "monitoring",
    icon: Activity,
    title: "home.feature.monitoring.title",
    description: "home.feature.monitoring.description",
    detail: "home.feature.monitoring.detail",
    tone: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "home.feature.analytics.title",
    description: "home.feature.analytics.description",
    detail: "home.feature.analytics.detail",
    tone: "bg-sky-600/10 text-sky-700 dark:text-sky-300",
  },
  {
    id: "anomalies",
    icon: CircleAlert,
    title: "home.feature.anomalies.title",
    description: "home.feature.anomalies.description",
    detail: "home.feature.anomalies.detail",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  {
    id: "recommendations",
    icon: Lightbulb,
    title: "home.feature.recommendations.title",
    description: "home.feature.recommendations.description",
    detail: "home.feature.recommendations.detail",
    tone: "bg-violet-600/10 text-violet-700 dark:text-violet-300",
  },
] as const;

type FeatureId = (typeof featureCards)[number]["id"];

function FeatureIllustration({ type }: { type: FeatureId }) {
  if (type === "monitoring") {
    return (
      <div aria-hidden="true" className="home-feature-visual home-feature-visual--bars">
        {[35, 58, 44, 78, 52].map((height, index) => (
          <span
            key={index}
            className="home-feature-bar"
            style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
          />
        ))}
      </div>
    );
  }

  if (type === "analytics") {
    return (
      <div aria-hidden="true" className="home-feature-visual home-feature-visual--line">
        <svg viewBox="0 0 64 48" fill="none">
          <path className="home-feature-gridline" d="M4 10.5h56M4 24.5h56M4 38.5h56" />
          <path className="home-feature-trend" d="m5 34 13-9 12 4 13-15 16 6" />
          <circle className="home-feature-trend-point" cx="59" cy="20" r="3" />
        </svg>
      </div>
    );
  }

  if (type === "anomalies") {
    return (
      <div aria-hidden="true" className="home-feature-visual home-feature-visual--alert">
        <span className="home-feature-alert-ring" />
        <CircleAlert className="size-7" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="home-feature-visual home-feature-visual--idea">
      <span className="home-feature-idea-ring">
        <Lightbulb className="size-6" />
      </span>
      <span className="home-feature-idea-spark" />
    </div>
  );
}

// Shared focus ring so every plain link is keyboard-visible.
const focusRing =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function HomeLanding() {
  const { t } = useI18n();
  const [expandedFeature, setExpandedFeature] = useState<FeatureId | null>(null);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-home-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("home-motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("home-motion-ready");
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className={`flex items-center gap-2.5 ${focusRing}`} aria-label="EnergyInsight home">
            <span className="grad-emerald flex size-9 items-center justify-center rounded-lg text-white">
              <Zap className="size-5 fill-current" />
            </span>
            <span className="text-brand-gradient text-lg font-bold tracking-tight">EnergyInsight</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Main navigation">
            <a className={`text-muted-foreground transition-colors hover:text-foreground ${focusRing}`} href="#features">{t("home.nav.features")}</a>
            <a className={`text-muted-foreground transition-colors hover:text-foreground ${focusRing}`} href="#about">{t("home.nav.about")}</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LanguageToggle /></div>
            <ThemeToggle />
            <Button asChild size="sm" className="ml-1 bg-emerald-700 text-white hover:bg-emerald-800">
              <Link href="/login">{t("home.nav.signIn")}<ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ───────── Hero ───────── */}
        <section className="relative isolate border-b bg-background">
          {/* Quiet "meter paper" grid that fades out downwards */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(6,95,70,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,95,70,0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]"
          />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
            <div className="home-hero-copy max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-600/5 px-3 py-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                <span className="home-pulse size-2 rounded-full bg-emerald-500" />
                {t("home.eyebrow")}
              </div>
              <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-emerald-950 dark:text-foreground sm:text-5xl lg:text-6xl">
                {t("home.title")}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {t("home.description")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 bg-emerald-700 px-6 text-white hover:bg-emerald-800">
                  <Link href="/login">{t("home.primary")}<ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-emerald-900/25 bg-transparent px-6">
                  <a href="#features">{t("home.secondary")}<ArrowDownRight className="size-4" /></a>
                </Button>
              </div>
            </div>

            {/* The one memorable element: a readable sample chart with a flagged anomaly */}
            <div data-home-reveal className="home-dashboard-preview mx-auto w-full max-w-xl">
              <div className="overflow-hidden rounded-2xl border border-emerald-950/20 bg-[#0a2723] p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-emerald-100/75">{t("home.demo")}</p>
                    <h2 className="mt-1 text-lg font-semibold">{t("home.chartTitle")}</h2>
                  </div>
                  <span className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-emerald-50/85">{t("home.chartPeriod")}</span>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <p className="text-4xl font-bold tracking-tight">
                    182.4 <span className="text-sm font-medium text-emerald-100/75">{t("home.chartUnit")}</span>
                  </p>
                  <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-medium text-emerald-200">
                    <Activity className="size-3.5" /> +4.8%
                  </span>
                </div>

                {/* Chart: gridlines + bars + day labels */}
                <div className="mt-5 flex gap-3">
                  <div aria-hidden="true" className="flex h-40 flex-col justify-between text-[11px] tabular-nums text-emerald-100/70">
                    <span>100</span><span>50</span><span>0</span>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-40" role="img" aria-label={t("home.chartTitle")}>
                      <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
                        <span className="border-t border-white/10" />
                        <span className="border-t border-dashed border-white/10" />
                        <span className="border-t border-white/15" />
                      </div>
                      <div className="relative flex h-full items-end gap-2 sm:gap-3">
                        {chartValues.map((value, index) => (
                          <div key={chartDays[index]} className="flex h-full flex-1 flex-col items-center justify-end">
                            {index === peakIndex && (
                              <span className="mb-1 rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-950">{value}</span>
                            )}
                            <div
                              className={`home-chart-bar w-full max-w-9 rounded-t-sm ${index === peakIndex ? "bg-amber-400" : "bg-emerald-300/45"}`}
                              style={{ height: `${value}%`, animationDelay: `${index * 90}ms` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 sm:gap-3">
                      {chartDays.map((day) => (
                        <span key={day} className="flex-1 text-center text-[11px] text-emerald-100/75">{t(day)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { icon: Building2, value: "05", label: t("home.stat.buildings"), accent: "text-emerald-300" },
                    { icon: Zap, value: "30", label: t("home.stat.meters"), accent: "text-emerald-300" },
                    { icon: CircleAlert, value: "03", label: t("home.stat.anomalies"), accent: "text-amber-300" },
                  ].map(({ icon: Icon, value, label, accent }, index) => (
                    <div key={label} className="home-stat-card rounded-lg border border-white/10 bg-white/[0.05] p-3" style={{ animationDelay: `${450 + index * 120}ms` }}>
                      <Icon className={`size-4 ${accent}`} />
                      <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-emerald-100/75">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Always-visible sample-data notice */}
                <p className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-amber-200">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-amber-400" />
                  {t("home.demoData")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Features: ruled columns instead of four floating cards ───────── */}
        <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div data-home-reveal className="home-reveal mb-10 max-w-2xl sm:mb-12">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t("home.features.eyebrow")}</p>
              <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-emerald-950 dark:text-foreground sm:text-4xl">{t("home.features.title")}</h2>
              <p className="mt-4 leading-7 text-muted-foreground">{t("home.features.description")}</p>
            </div>
            <div className="grid divide-y border-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              {featureCards.map(({ id, icon: Icon, title, description, detail, tone }) => {
                const isExpanded = expandedFeature === id;
                return (
                <article
                  key={id}
                  className={`home-feature-item py-7 sm:p-7 sm:odd:pl-0 lg:odd:pl-7 lg:first:pl-0 lg:last:pr-0 sm:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0 ${isExpanded ? "is-expanded" : ""}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setExpandedFeature(id);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement)) {
                      setExpandedFeature((current) => current === id ? null : current);
                    }
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`feature-details-${id}`}
                    className="home-feature-trigger w-full cursor-pointer text-left"
                    onFocus={() => setExpandedFeature(id)}
                    onBlur={(event) => {
                      if (!event.currentTarget.closest(".home-feature-item")?.matches(":hover")) {
                        setExpandedFeature((current) => current === id ? null : current);
                      }
                    }}
                    onPointerDown={(event) => {
                      if (event.pointerType !== "mouse") {
                        setExpandedFeature((current) => current === id ? null : id);
                      }
                    }}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className={`home-feature-icon flex size-11 items-center justify-center rounded-lg ${tone}`}>
                        <Icon className="size-5" />
                      </span>
                      <ChevronDown aria-hidden="true" className="home-feature-chevron mt-3 size-4 shrink-0 text-muted-foreground" />
                    </span>
                    <span className="mt-4 block text-base font-semibold">{t(title)}</span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">{t(description)}</span>
                  </button>
                  <div
                    id={`feature-details-${id}`}
                    aria-hidden={!isExpanded}
                    className="home-feature-detail"
                  >
                    <div className="home-feature-detail-inner">
                      <FeatureIllustration type={id} />
                      <p className="text-xs leading-5 text-muted-foreground">{t(detail)}</p>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────── About ───────── */}
        <section id="about" className="scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div data-home-reveal className="home-reveal mx-auto grid max-w-7xl gap-10 rounded-2xl bg-emerald-950 px-6 py-10 text-white sm:px-10 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-14">
            <div>
              <p className="text-sm font-semibold text-emerald-300">{t("home.about.eyebrow")}</p>
              <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t("home.about.title")}</h2>
            </div>
            <div>
              <p className="text-sm leading-7 text-emerald-50/85 sm:text-base">{t("home.about.description")}</p>
              <ul className="mt-6 space-y-3">
                {(["home.about.point1", "home.about.point2", "home.about.point3"] as const).map((key) => (
                  <li key={key} className="flex items-start gap-3 text-sm text-emerald-50">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ───────── Final call to action ───────── */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div data-home-reveal className="home-reveal mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-2xl bg-emerald-700 p-8 text-center text-white sm:p-10 md:flex-row md:text-left">
            <div className="max-w-2xl">
              <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">{t("home.cta.title")}</h2>
              <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">{t("home.cta.description")}</p>
            </div>
            <Button asChild size="lg" className="home-cta-button h-12 shrink-0 bg-white px-6 font-semibold text-emerald-900 hover:bg-emerald-50">
              <Link href="/login">{t("home.cta.button")}<ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <Link href="/" className={`flex items-center gap-2 font-semibold text-foreground ${focusRing}`}>
            <span className="grad-emerald flex size-7 items-center justify-center rounded-md text-white"><Zap className="size-4 fill-current" /></span>
            EnergyInsight
          </Link>
          <span className="text-center">{t("home.footer")}</span>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <a href="#features" className={`transition-colors hover:text-foreground ${focusRing}`}>{t("home.nav.features")}</a>
            <a href="#about" className={`transition-colors hover:text-foreground ${focusRing}`}>{t("home.nav.about")}</a>
            <Link href="/login" className={`font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-300 ${focusRing}`}>{t("home.nav.signIn")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}