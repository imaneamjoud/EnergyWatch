"use client";

export function Heatmap({
  rows,
  max,
  locale,
}: {
  rows: { day: number; values: number[] }[];
  max: number;
  locale: string;
}) {
  const dayLabel = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const cols = { gridTemplateColumns: "5.5rem repeat(24, minmax(0, 1fr))" };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] space-y-1">
        <div className="grid items-center gap-1" style={cols}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[10px] text-muted-foreground">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.day} className="grid items-center gap-1" style={cols}>
            <span className="text-xs text-muted-foreground">{dayLabel(r.day)}</span>
            {r.values.map((v, h) => (
              <div
                key={h}
                title={`${dayLabel(r.day)} ${String(h).padStart(2, "0")}:00 UTC, ${v.toLocaleString(locale, {
                  maximumFractionDigits: 1,
                })} kWh`}
                className="h-6 rounded-sm"
                style={{
                  backgroundColor: `rgba(16,185,129,${(0.08 + 0.92 * Math.sqrt(max > 0 ? v / max : 0)).toFixed(3)})`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
