"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function ConsumptionLineChart({ data }: { data: { day: string; kwh: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="consoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={tick} stroke="var(--border)" />
          <YAxis unit=" kWh" width={80} tick={tick} stroke="var(--border)" />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Area type="monotone" dataKey="kwh" stroke="var(--chart-1)" strokeWidth={3} fill="url(#consoFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
