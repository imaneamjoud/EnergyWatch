"use client";

import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function TimeSeriesChart({
  data,
  anomalies = [],
  formatTick,
  locale,
}: {
  data: { ts: number; kwh: number }[];
  anomalies?: { ts: number; kwh: number }[];
  formatTick: (ts: number) => string;
  locale: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => formatTick(Number(v))}
            tick={tick}
            stroke="var(--border)"
            minTickGap={32}
          />
          <YAxis width={64} tick={tick} stroke="var(--border)" />
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
          <Area type="monotone" dataKey="kwh" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#tsFill)" />
          {anomalies.map((a) => (
            <ReferenceDot key={a.ts} x={a.ts} y={a.kwh} r={6} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
