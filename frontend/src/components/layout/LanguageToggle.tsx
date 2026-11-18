"use client";

import { useI18n } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("topbar.language")}
      className="flex items-center rounded-full border bg-muted p-0.5 text-xs font-semibold"
    >
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-all",
            lang === l
              ? "grad-emerald text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
