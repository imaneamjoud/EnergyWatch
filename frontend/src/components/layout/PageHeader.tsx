"use client";

import { useI18n } from "@/context/LanguageContext";
import type { TranslationKey } from "@/i18n/dictionaries";

export function PageHeader({
  titleKey,
  descKey,
}: {
  titleKey: TranslationKey;
  descKey?: TranslationKey;
}) {
  const { t } = useI18n();
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{t(titleKey)}</h2>
      {descKey && <p className="text-sm text-muted-foreground">{t(descKey)}</p>}
    </div>
  );
}
