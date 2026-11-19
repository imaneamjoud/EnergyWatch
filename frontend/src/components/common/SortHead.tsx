"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function SortHead<K extends string>({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: K;
  sortKey: K;
  sortDir: "asc" | "desc";
  onSort: (k: K) => void;
}) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}
