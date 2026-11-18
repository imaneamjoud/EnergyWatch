import type { BuildingType } from "@/types";

export const BUILDING_TYPES: BuildingType[] = ["OFFICE", "LAB", "INDUSTRIAL", "WAREHOUSE", "DATA_CENTER"];

export const typeKey = {
  OFFICE: "btype.OFFICE",
  LAB: "btype.LAB",
  INDUSTRIAL: "btype.INDUSTRIAL",
  WAREHOUSE: "btype.WAREHOUSE",
  DATA_CENTER: "btype.DATA_CENTER",
} as const;

export const typeStyle: Record<BuildingType, string> = {
  OFFICE: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  LAB: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  INDUSTRIAL: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  WAREHOUSE: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  DATA_CENTER: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};
