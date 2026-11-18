import {
  LayoutDashboard, Building2, Gauge, Activity, BarChart3,
  AlertTriangle, TrendingUp, Lightbulb, FileText, Users, Bell, Settings,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@/types";
import type { TranslationKey } from "@/i18n/dictionaries";

export interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavSection {
  titleKey: TranslationKey;
  items: NavItem[];
}

const ALL: Role[] = ["ADMIN", "ANALYST", "MANAGER"];

export const navigation: NavSection[] = [
  {
    titleKey: "section.main",
    items: [
      { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL },
      { labelKey: "nav.buildings", href: "/buildings", icon: Building2, roles: ALL },
      { labelKey: "nav.meters", href: "/meters", icon: Gauge, roles: ALL },
      { labelKey: "nav.monitoring", href: "/monitoring", icon: Activity, roles: ALL },
      { labelKey: "nav.analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN", "ANALYST"] },
    ],
  },
  {
    titleKey: "section.intelligence",
    items: [
      { labelKey: "nav.anomalies", href: "/anomalies", icon: AlertTriangle, roles: ALL },
      { labelKey: "nav.prediction", href: "/prediction", icon: TrendingUp, roles: ["ADMIN", "ANALYST"] },
      { labelKey: "nav.recommendations", href: "/recommendations", icon: Lightbulb, roles: ALL },
    ],
  },
  {
    titleKey: "section.management",
    items: [
      { labelKey: "nav.reports", href: "/reports", icon: FileText, roles: ALL },
      { labelKey: "nav.users", href: "/users", icon: Users, roles: ["ADMIN"] },
      { labelKey: "nav.notifications", href: "/notifications", icon: Bell, roles: ["ADMIN"] },
      { labelKey: "nav.settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];
