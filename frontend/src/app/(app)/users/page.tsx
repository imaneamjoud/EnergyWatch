"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Pencil, Plus, Power, Search, UserCheck, UserX, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessDenied } from "@/components/common/AccessDenied";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getBuildings } from "@/services/energy";
import { createUser, getUsers, setUserActive, updateUser, type UserInput } from "@/services/users";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { Building, Role, User } from "@/types";

const roleKey = { ADMIN: "role.ADMIN", ANALYST: "role.ANALYST", MANAGER: "role.MANAGER" } as const;
const roleStyle: Record<Role, string> = {
  ADMIN: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  ANALYST: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  MANAGER: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};
const selectClass =
  "h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export default function UsersPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "ADMIN") return <AccessDenied />;
  return <UsersContent currentUser={user} />;
}

function UsersContent({ currentUser }: { currentUser: User }) {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<User[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [actionError, setActionError] = useState<TranslationKey | null>(null);

  const load = useCallback(async () => {
    const [u, b] = await Promise.all([getUsers(), getBuildings()]);
    setUsers(u);
    setBuildings(b);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users ?? []).filter(
      (u) =>
        (roleFilter === "ALL" || u.role === roleFilter) &&
        (statusFilter === "ALL" || (statusFilter === "ACTIVE" ? u.active !== false : u.active === false)) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, search, roleFilter, statusFilter]);

  const handleSubmit = async (input: UserInput) => {
    const res = editing
      ? await updateUser(editing.id, input, currentUser.id)
      : await createUser(input, currentUser.id);
    if (res.ok) await load();
    return res;
  };

  const toggleActive = async (u: User) => {
    setActionError(null);
    const res = await setUserActive(u.id, u.active === false, currentUser.id);
    if (res.ok) await load();
    else setActionError(res.error);
  };

  if (!users) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  const active = users.filter((u) => u.active !== false);
  const covered = new Set(active.filter((u) => u.role === "MANAGER").flatMap((u) => u.buildingIds));
  const uncovered = buildings.filter((b) => !covered.has(b.id)).length;
  const bName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader titleKey="page.users.title" descKey="page.users.desc" />
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="grad-emerald border-0 text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("usr.add")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("usr.kpi.total")} value={users.length} icon={Users} tone="sky" />
        <KpiCard label={t("usr.kpi.active")} value={active.length} icon={UserCheck} tone="emerald" />
        <KpiCard label={t("usr.kpi.inactive")} value={users.length - active.length} icon={UserX} tone="rose" />
        <KpiCard label={t("usr.kpi.uncovered")} value={uncovered} icon={Building2} tone="amber" hint={t("usr.kpi.uncoveredHint")} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("usr.search")} className="pl-9" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")} aria-label={t("usr.col.role")} className={selectClass}>
              <option value="ALL">{t("usr.filter.allRoles")}</option>
              {(["ADMIN", "ANALYST", "MANAGER"] as const).map((r) => (
                <option key={r} value={r}>{t(roleKey[r])}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")} aria-label={t("usr.col.status")} className={selectClass}>
              <option value="ALL">{t("usr.filter.allStatus")}</option>
              <option value="ACTIVE">{t("usr.status.active")}</option>
              <option value="INACTIVE">{t("usr.status.inactive")}</option>
            </select>
            <span className="text-sm text-muted-foreground">{fill(t("usr.resultCount"), { n: visible.length })}</span>
          </div>

          {actionError && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t(actionError)}
            </div>
          )}

          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("usr.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("usr.col.user")}</TableHead>
                  <TableHead>{t("usr.col.role")}</TableHead>
                  <TableHead>{t("usr.col.buildings")}</TableHead>
                  <TableHead>{t("usr.col.status")}</TableHead>
                  <TableHead className="text-right">{t("usr.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((u) => {
                  const isActive = u.active !== false;
                  const initials = u.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <TableRow key={u.id} className={cn(!isActive && "opacity-60")}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="grad-emerald flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                            {initials}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">
                              {u.name}
                              {u.id === currentUser.id && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">({t("usr.you")})</span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", roleStyle[u.role])}>
                          {t(roleKey[u.role])}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.role !== "MANAGER" ? (
                          <span className="text-sm text-muted-foreground">{t("usr.allBuildings")}</span>
                        ) : u.buildingIds.length === 0 ? (
                          <span className="text-sm text-muted-foreground">{t("usr.noBuilding")}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.buildingIds.map((id) => (
                              <span key={id} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                {bName(id)}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400")} />
                          {isActive ? t("usr.status.active") : t("usr.status.inactive")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className={iconBtn}
                            aria-label={t("usr.edit")}
                            title={t("usr.edit")}
                            onClick={() => {
                              setEditing(u);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={cn(iconBtn, isActive ? "hover:text-rose-500" : "hover:text-emerald-500")}
                            aria-label={isActive ? t("usr.deactivate") : t("usr.activate")}
                            title={isActive ? t("usr.deactivate") : t("usr.activate")}
                            onClick={() => toggleActive(u)}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <p className="text-xs text-muted-foreground">{t("usr.demoNote2")}</p>
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        buildings={buildings}
        currentUserId={currentUser.id}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
