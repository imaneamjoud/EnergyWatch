"use client";

import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function ForecastChart({
  data,
  splitTs,
  actualLabel,
  forecastLabel,
  formatTick,
  locale,
}: {
  data: { ts: number; actual?: number; forecast?: number }[];
  splitTs?: number;
  actualLabel: string;
  forecastLabel: string;
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
            minTickGap={44}
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
          {splitTs !== undefined && (
            <ReferenceLine x={splitTs} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          )}
          <Line type="monotone" dataKey="actual" name={actualLabel} stroke="#10b981" strokeWidth={2.5} dot={false} />
          <Line
            type="monotone"
            dataKey="forecast"
            name={forecastLabel}
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
