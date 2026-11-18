"use client";

export function TopMeters({
  items,
  buildingName,
  locale,
}: {
  items: { meterId: string; buildingId: string; kwh: number }[];
  buildingName: (id: string) => string;
  locale: string;
}) {
  const max = items[0]?.kwh || 1;
  return (
    <ol className="space-y-4">
      {items.map((m, i) => (
        <li key={m.meterId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              <span className="font-medium">{m.meterId}</span>
              <span className="text-muted-foreground">{buildingName(m.buildingId)}</span>
            </span>
            <span className="font-semibold">{m.kwh.toLocaleString(locale)} kWh</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="grad-emerald h-full rounded-full" style={{ width: `${(m.kwh / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
