"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/LanguageContext";
import { fill } from "@/lib/format";

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  const { t } = useI18n();
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">{fill(t("common.pageOf"), { p: page, n: pageCount })}</span>
      <Button variant="outline" size="icon" aria-label={t("common.prev")} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={t("common.next")}
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
