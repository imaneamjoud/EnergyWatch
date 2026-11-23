"use client";

import { useAuth } from "@/context/AuthContext";
import { Brand, NavList, SidebarUser } from "@/components/layout/NavList";

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <Brand />
      <NavList />
      <SidebarUser />
    </aside>
  );
}
