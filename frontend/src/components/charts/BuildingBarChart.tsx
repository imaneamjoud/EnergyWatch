"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function BuildingBarChart({
  data,
  unit = " kWh",
}: {
  data: { name: string; kwh: number }[];
  unit?: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" />
              <stop offset="100%" stopColor="var(--chart-2)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={tick} stroke="var(--border)" />
          <YAxis unit={unit} width={unit.length > 5 ? 96 : 80} tick={tick} stroke="var(--border)" />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="kwh" fill="url(#barFill)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
