"use client";

import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";

export function AccessDenied() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-12 text-center">
      <span className="grad-rose flex h-14 w-14 items-center justify-center rounded-2xl">
        <ShieldAlert className="h-7 w-7 text-white" />
      </span>
      <h2 className="text-xl font-bold">{t("common.accessDenied")}</h2>
      <p className="text-sm text-muted-foreground">{t("common.accessDeniedDesc")}</p>
    </div>
  );
}
