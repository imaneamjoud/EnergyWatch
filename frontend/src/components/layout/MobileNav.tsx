"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Brand, NavList, SidebarUser } from "@/components/layout/NavList";
import { useI18n } from "@/context/LanguageContext";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button type="button" className="ei-iconbtn" aria-label={t("nav.openMenu")} onClick={() => setOpen(true)}>
        <Menu size={18} aria-hidden="true" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <SheetTitle className="sr-only">{t("nav.menuTitle")}</SheetTitle>
          <SheetDescription className="sr-only">{t("nav.menuDesc")}</SheetDescription>
          <Brand />
          <NavList onNavigate={close} />
          <SidebarUser onNavigate={close} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
