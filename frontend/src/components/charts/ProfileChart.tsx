"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

export function ProfileChart({
  data,
  weekdayLabel,
  weekendLabel,
  locale,
}: {
  data: { hour: number; weekday: number; weekend: number }[];
  weekdayLabel: string;
  weekendLabel: string;
  locale: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="hour" tickFormatter={(h) => `${h} h`} tick={tick} stroke="var(--border)" />
          <YAxis unit=" kWh" width={80} tick={tick} stroke="var(--border)" />
          <Tooltip
            labelFormatter={(h) => `${h}:00 UTC`}
            formatter={(v) => `${Number(v).toLocaleString(locale)} kWh`}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Legend formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>} />
          <Line type="monotone" dataKey="weekday" name={weekdayLabel} stroke="#10b981" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="weekend" name={weekendLabel} stroke="#f59e0b" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
