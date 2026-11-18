"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BUILDING_COLORS, FALLBACK_COLOR } from "@/lib/config";

export function ShareDonutChart({
  data,
  locale,
}: {
  data: { id: string; name: string; kwh: number }[];
  locale: string;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="kwh" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={3} stroke="none">
            {data.map((d) => (
              <Cell key={d.id} fill={BUILDING_COLORS[d.id] ?? FALLBACK_COLOR} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => `${Number(v).toLocaleString(locale)} kWh`}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Legend formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
