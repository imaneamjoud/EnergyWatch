"use client";

import { useI18n } from "@/context/LanguageContext";

export function UnderConstruction() {
  const { t } = useI18n();
  return <p className="text-sm text-muted-foreground">{t("common.underConstruction")}</p>;
}
