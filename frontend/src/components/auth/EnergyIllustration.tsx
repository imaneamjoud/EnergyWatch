const STARS: [number, number][] = [
  [60, 60], [150, 110], [230, 40], [340, 80], [430, 50], [520, 100],
  [560, 170], [90, 200], [470, 210], [300, 30], [20, 140], [390, 140],
];

function Turbine({
  x, base, h, dur, delay = 0, tone,
}: {
  x: number; base: number; h: number; dur: number; delay?: number; tone: string;
}) {
  const hy = base - h;
  const L = h * 0.5;
  const tw = h * 0.05;
  const bw = Math.max(1.8, L * 0.045);
  return (
    <g stroke="#064e3b" strokeOpacity="0.45" strokeWidth="0.8">
      <path
        d={`M${x - tw} ${base} L${x + tw} ${base} L${x + tw * 0.35} ${hy} L${x - tw * 0.35} ${hy} Z`}
        fill={tone}
      />
      <g
        className="ei-blades"
        style={{ transformOrigin: `${x}px ${hy}px`, animationDuration: `${dur}s`, animationDelay: `-${delay}s` }}
      >
        {[0, 120, 240].map((a) => (
          <path
            key={a}
            d={`M${x - bw} ${hy} L${x} ${hy - L} L${x + bw} ${hy} Z`}
            transform={`rotate(${a} ${x} ${hy})`}
            fill={tone}
          />
        ))}
      </g>
      <circle cx={x} cy={hy} r={tw * 0.9 + 1.5} fill={tone} />
    </g>
  );
}

const pylons = [
  { x: 40, base: 705, h: 210 },
  { x: 300, base: 695, h: 190 },
  { x: 560, base: 705, h: 210 },
];

const geom = (p: { x: number; base: number; h: number }) => {
  const top = p.base - p.h;
  return { top, w: p.h * 0.14, a1: top + p.h * 0.12, a2: top + p.h * 0.3 };
};

function Pylon({ x, base, h }: { x: number; base: number; h: number }) {
  const { top, w, a1, a2 } = geom({ x, base, h });
  const mid = top + h * 0.45;
  return (
    <g>
      <path d={`M${x - w} ${base} L${x - 2} ${top} M${x + w} ${base} L${x + 2} ${top}`} />
      <path d={`M${x - w * 1.5} ${a1} L${x + w * 1.5} ${a1} M${x - w * 1.1} ${a2} L${x + w * 1.1} ${a2}`} />
      <path
        d={`M${x - w} ${base} L${x + w * 0.55} ${mid} M${x + w} ${base} L${x - w * 0.55} ${mid} M${x - w * 0.55} ${mid} L${x + w * 0.3} ${top + h * 0.3}`}
        strokeWidth="1.3"
      />
    </g>
  );
}

export function EnergyIllustration({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
      className="absolute inset-0 h-full w-full"
    >
      <style>{`
        @keyframes ei-spin { to { transform: rotate(360deg); } }
        @keyframes ei-pulse { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
        .ei-blades { animation: ei-spin 10s linear infinite; }
        .ei-pulse { animation: ei-pulse 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ei-blades, .ei-pulse { animation: none; } }
      `}</style>

      <defs>
        <linearGradient id="ei-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#022c22" />
          <stop offset="0.45" stopColor="#064e3b" />
          <stop offset="0.72" stopColor="#0f766e" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <radialGradient id="ei-sunglow" cx="300" cy="500" r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ei-halo" cx="300" cy="260" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ei-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef08a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="ei-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0369a1" />
          <stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
        <filter id="ei-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ciel */}
      <rect width="600" height="800" fill="url(#ei-sky)" />
      {STARS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 1.8 : 1.2}
          fill="#fff"
          fillOpacity="0.75"
          className={i % 2 === 0 ? "ei-pulse" : undefined}
          style={{ animationDelay: `${(i % 5) * 0.5}s` }}
        />
      ))}

      {/* soleil */}
      <circle cx="300" cy="500" r="260" fill="url(#ei-sunglow)" />
      <circle cx="300" cy="500" r="60" fill="#fde68a" fillOpacity="0.95" />

      {/* collines lointaines et éoliennes */}
      <path d="M0 560 C80 520 160 540 240 525 C340 505 420 545 600 520 L600 800 L0 800 Z" fill="#0f766e" />
      <Turbine x={90} base={545} h={85} dur={14} delay={2} tone="#a7f3d0" />
      <Turbine x={210} base={535} h={100} dur={12} delay={5} tone="#a7f3d0" />
      <Turbine x={470} base={535} h={90} dur={13} delay={1} tone="#a7f3d0" />
      <Turbine x={545} base={528} h={70} dur={15} delay={7} tone="#a7f3d0" />

      {/* collines du milieu et éoliennes */}
      <path d="M0 620 C100 585 200 610 300 595 C420 578 500 610 600 590 L600 800 L0 800 Z" fill="#065f46" />
      <Turbine x={140} base={612} h={150} dur={9} delay={3} tone="#d1fae5" />
      <Turbine x={380} base={600} h={170} dur={8} delay={6} tone="#d1fae5" />
      <Turbine x={520} base={606} h={115} dur={10} delay={0} tone="#d1fae5" />

      {/* arches de verre */}
      <rect x="40" y="90" width="96" height="560" rx="48" fill="#fff" fillOpacity="0.05" stroke="#fff" strokeOpacity="0.25" />
      <rect x="464" y="90" width="96" height="560" rx="48" fill="#fff" fillOpacity="0.05" stroke="#fff" strokeOpacity="0.25" />

      {/* éclair */}
      <circle cx="300" cy="260" r="120" fill="url(#ei-halo)" />
      <circle cx="300" cy="260" r="95" fill="#fff" fillOpacity="0.08" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      <path
        d="M318 192 L262 280 L298 280 L284 335 L342 245 L306 245 Z"
        fill="url(#ei-bolt)"
        filter="url(#ei-glow)"
      />
      {[[232, 210, 3], [372, 304, 2.5], [250, 334, 2], [362, 204, 2]].map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="#fde68a"
          className="ei-pulse"
          style={{ animationDelay: `${i * 0.6}s` }}
        />
      ))}

      {/* pylônes et câbles */}
      <g stroke="#ccfbf1" strokeOpacity="0.55" strokeWidth="2.2" fill="none" strokeLinecap="round">
        {pylons.map((p) => (
          <Pylon key={p.x} {...p} />
        ))}
      </g>
      <g stroke="#ccfbf1" strokeOpacity="0.5" strokeWidth="1.2" fill="none">
        {pylons.slice(0, -1).flatMap((p, i) => {
          const q = pylons[i + 1];
          const a = geom(p);
          const b = geom(q);
          const arms = [
            { ya: a.a1, yb: b.a1, k: 1.5 },
            { ya: a.a2, yb: b.a2, k: 1.1 },
          ];
          return arms.map((arm, j) => (
            <path
              key={`w-${i}-${j}`}
              d={`M${p.x + a.w * arm.k} ${arm.ya} Q${(p.x + q.x) / 2} ${(arm.ya + arm.yb) / 2 + 30} ${q.x - b.w * arm.k} ${arm.yb}`}
            />
          ));
        })}
      </g>

      {/* sol et panneaux solaires */}
      <path d="M0 705 C150 690 450 690 600 705 L600 800 L0 800 Z" fill="#022c22" />
      {[0, 1, 2].map((r) => {
        const y = 716 + r * 28;
        const h = 22 + r * 3;
        const w = 58 + r * 14;
        const n = Math.ceil(640 / w) + 1;
        return Array.from({ length: n }).map((_, c) => {
          const x = c * w - r * 9;
          return (
            <polygon
              key={`${r}-${c}`}
              points={`${x + 10},${y} ${x + w - 4 + 10},${y} ${x + w - 4},${y + h} ${x},${y + h}`}
              fill="url(#ei-panel)"
              stroke="#7dd3fc"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
          );
        });
      })}
    </svg>
  );
}
