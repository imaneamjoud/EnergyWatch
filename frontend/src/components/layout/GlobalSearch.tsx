"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Building2, Gauge, Search, UserCircle, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { anomalyStatusKey, severityKey } from "@/lib/anomalyReco";
import { typeKey } from "@/lib/buildingTypes";
import { fill } from "@/lib/format";
import { navigation } from "@/lib/navigation";
import { getSearchData, type SearchData } from "@/services/search";

type Group = "pages" | "buildings" | "meters" | "anomalies";

interface Item {
  key: string;
  group: Group;
  title: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  haystack: string;
}

const GROUP_ORDER: Group[] = ["pages", "buildings", "meters", "anomalies"];
const GROUP_KEY = {
  pages: "search.group.pages",
  buildings: "search.group.buildings",
  meters: "search.group.meters",
  anomalies: "search.group.anomalies",
} as const;
const LIMITS: Record<Group, number> = { pages: 6, buildings: 5, meters: 6, anomalies: 5 };

// Recherche insensible aux accents et à la casse
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function GlobalSearch() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [data, setData] = useState<SearchData | null>(null);
  const [mod, setMod] = useState("Ctrl");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setMod("⌘");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setQuery("");
    setActive(0);
    getSearchData(user.buildingIds).then(setData);
  }, [open, user]);

  const items = useMemo<Item[]>(() => {
    if (!user) return [];
    const list: Item[] = [];

    for (const section of navigation) {
      for (const it of section.items) {
        if (!it.roles.includes(user.role)) continue;
        list.push({
          key: `page:${it.href}`,
          group: "pages",
          title: t(it.labelKey),
          sub: t(section.titleKey),
          href: it.href,
          icon: it.icon,
          haystack: norm(`${t(it.labelKey)} ${t(section.titleKey)} ${it.href}`),
        });
      }
    }
    list.push({
      key: "page:/profile",
      group: "pages",
      title: t("page.profile.title"),
      sub: t("page.profile.desc"),
      href: "/profile",
      icon: UserCircle,
      haystack: norm(`${t("page.profile.title")} ${t("page.profile.desc")} /profile`),
    });

    if (data) {
      for (const b of data.buildings) {
        list.push({
          key: `building:${b.id}`,
          group: "buildings",
          title: b.name,
          sub: `${t(typeKey[b.type])} · ${b.address || "—"}`,
          href: `/buildings/${b.id}`,
          icon: Building2,
          haystack: norm(`${b.name} ${b.address} ${t(typeKey[b.type])}`),
        });
      }
      for (const m of data.meters) {
        list.push({
          key: `meter:${m.id}`,
          group: "meters",
          title: m.id,
          sub: `${m.buildingName} · ${m.location || "—"}${m.online ? "" : ` · ${t("meters.transmission.silent")}`}`,
          href: `/meters/${m.id}`,
          icon: Gauge,
          haystack: norm(`${m.id} ${m.buildingName} ${m.location}`),
        });
      }
      for (const a of data.anomalies) {
        list.push({
          key: `anomaly:${a.id}`,
          group: "anomalies",
          title: fill(t("anom.detail.title"), { id: a.id }),
          sub: `${a.meterId} · ${a.buildingName} · ${t(severityKey[a.severity])}`,
          href: "/anomalies",
          icon: AlertTriangle,
          haystack: norm(
            `${a.id} ${a.meterId} ${a.buildingName} ${t(severityKey[a.severity])} ${t(anomalyStatusKey[a.status])}`
          ),
        });
      }
    }
    return list;
  }, [user, data, t]);

  const flat = useMemo(() => {
    const q = norm(query.trim());
    const tokens = q.split(/\s+/).filter(Boolean);
    const rank = (i: Item) => {
      const title = norm(i.title);
      return title.startsWith(q) ? 0 : title.includes(q) ? 1 : 2;
    };
    const out: Item[] = [];
    for (const g of GROUP_ORDER) {
      const pool = items.filter(
        (i) => i.group === g && (tokens.length === 0 ? g === "pages" : tokens.every((tk) => i.haystack.includes(tk)))
      );
      pool.sort((a, b) => rank(a) - rank(b));
      out.push(...pool.slice(0, tokens.length === 0 ? 12 : LIMITS[g]));
    }
    return out;
  }, [items, query]);

  const rows = useMemo(() => {
    const out: ({ kind: "group"; label: string } | { kind: "item"; item: Item; index: number })[] = [];
    let index = 0;
    let last: Group | null = null;
    for (const item of flat) {
      if (item.group !== last) {
        last = item.group;
        out.push({ kind: "group", label: t(GROUP_KEY[item.group]) });
      }
      out.push({ kind: "item", item, index: index++ });
    }
    return out;
  }, [flat, t]);

  useEffect(() => {
    if (open) document.getElementById(`ei-cmd-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      go(flat[active]);
    }
  };

  return (
    <>
      <button type="button" className="ei-searchbtn" onClick={() => setOpen(true)} aria-label={t("search.title")}>
        <Search size={16} aria-hidden="true" />
        <span>{t("search.button")}</span>
        <kbd className="ei-kbd">{mod} K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">{t("search.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("search.desc")}</DialogDescription>

          <div className="ei-cmd-input-wrap">
            <Search size={18} aria-hidden="true" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="ei-cmd-list"
              aria-activedescendant={flat[active] ? `ei-cmd-${active}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t("search.placeholder")}
              className="ei-cmd-input"
            />
          </div>

          <div id="ei-cmd-list" role="listbox" className="ei-cmd-list">
            {rows.map((r) =>
              r.kind === "group" ? (
                <div key={`g-${r.label}`} className="ei-cmd-group">
                  {r.label}
                </div>
              ) : (
                <button
                  key={r.item.key}
                  id={`ei-cmd-${r.index}`}
                  type="button"
                  role="option"
                  aria-selected={r.index === active}
                  className="ei-cmd-item"
                  onMouseEnter={() => setActive(r.index)}
                  onClick={() => go(r.item)}
                >
                  <span className="ei-cmd-icon">
                    <r.item.icon size={16} aria-hidden="true" />
                  </span>
                  <span className="ei-cmd-main">
                    <span className="ei-cmd-title">{r.item.title}</span>
                    <span className="ei-cmd-sub">{r.item.sub}</span>
                  </span>
                </button>
              )
            )}
            {flat.length === 0 && <p className="ei-cmd-empty">{fill(t("search.empty"), { q: query })}</p>}
          </div>

          <div className="ei-cmd-foot">
            <span>
              <kbd className="ei-kbd">↑↓</kbd>
              {t("search.hint.navigate")}
            </span>
            <span>
              <kbd className="ei-kbd">↵</kbd>
              {t("search.hint.open")}
            </span>
            <span>
              <kbd className="ei-kbd">Esc</kbd>
              {t("search.hint.close")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
