"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BUILDING_COLORS, FALLBACK_COLOR } from "@/lib/config";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function BuildingsLineChart({
  data,
  series,
  formatTick,
  locale,
}: {
  data: Record<string, number>[];
  series: { id: string; name: string }[];
  formatTick: (ts: number) => string;
  locale: string;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => formatTick(Number(v))}
            tick={tick}
            stroke="var(--border)"
            minTickGap={28}
          />
          <YAxis width={56} tick={tick} stroke="var(--border)" />
          <Tooltip
            labelFormatter={(v) => formatTick(Number(v))}
            formatter={(v) => `${Number(v).toLocaleString(locale)} kWh`}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Legend formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>} />
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={BUILDING_COLORS[s.id] ?? FALLBACK_COLOR}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
