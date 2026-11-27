import { useId } from "react";

/*
 * Ícones ilustrados (SVG desenhados para o Carmaintrack): peças, filtros e
 * serviços. Têm cores próprias, para se reconhecerem à primeira vista, e
 * funcionam em qualquer paleta (clara ou escura).
 *
 * Uso: <PartIcon name="brakes" size={40} />
 */

const lin = (id, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    {stops.map(([o, c], i) => (
      <stop key={i} offset={o} stopColor={c} />
    ))}
  </linearGradient>
);
const rad = (id, stops, { cx = 0.4, cy = 0.35, r = 0.75 } = {}) => (
  <radialGradient id={id} cx={cx} cy={cy} r={r}>
    {stops.map(([o, c], i) => (
      <stop key={i} offset={o} stopColor={c} />
    ))}
  </radialGradient>
);

const SILVER = [[0, "#f8fafc"], [0.45, "#cbd5e1"], [1, "#64748b"]];
const CHROME_H = [[0, "#64748b"], [0.3, "#f1f5f9"], [0.55, "#cbd5e1"], [1, "#475569"]];
const DARK = [[0, "#4b5563"], [1, "#0f172a"]];
const pt = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

// Cada desenho recebe u(nome) -> id único do gradiente e f(nome) -> "url(#id)".
const ART = {
  gauge: (u, f) => (
    <>
      <defs>
        {rad(u("face"), [[0, "#374151"], [1, "#030712"]], { cx: 0.5, cy: 0.4, r: 0.6 })}
        {lin(u("ring"), SILVER)}
      </defs>
      <circle cx="24" cy="24" r="21" fill={f("face")} stroke={f("ring")} strokeWidth="3" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = 135 + i * 27;
        const [x1, y1] = pt(24, 24, 16.5, a);
        const [x2, y2] = pt(24, 24, i % 2 ? 14.5 : 13, a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i > 8 ? "#ef4444" : "#e5e7eb"} strokeWidth={i % 2 ? 1 : 1.6} />;
      })}
      <rect x="17.5" y="31" width="13" height="5" rx="1" fill="#0b0f14" stroke="#6b7280" strokeWidth=".6" />
      <path d="M19.5 33.5h9" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="1.4 .8" />
      <line x1="24" y1="24" x2={pt(24, 24, 14, 215)[0]} y2={pt(24, 24, 14, 215)[1]} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.8" fill={f("ring")} />
    </>
  ),

  oil: (u, f) => (
    <>
      <defs>
        {lin(u("body"), [[0, "#111827"], [0.35, "#4b5563"], [1, "#030712"]], { x2: 1, y2: 0 })}
        {lin(u("label"), [[0, "#fde68a"], [0.5, "#f59e0b"], [1, "#b45309"]], { x2: 1, y2: 0 })}
      </defs>
      <rect x="19" y="4" width="8" height="5" rx="1.2" fill={f("label")} />
      <path d="M17 9h12l3 4v0h0H14z" fill="#1f2937" />
      <path d="M13 13h20a3 3 0 0 1 3 3v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16a3 3 0 0 1 3-3z" fill={f("body")} />
      <path d="M36 15h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3v-3h2v-9h-2z" fill="#1f2937" />
      <rect x="12.5" y="20" width="21" height="16" rx="1.5" fill={f("label")} />
      <path d="M23 23.5c2.6 3.3 3.9 5.4 3.9 7a3.9 3.9 0 0 1-7.8 0c0-1.6 1.3-3.7 3.9-7z" fill="#111827" />
      <rect x="12.5" y="38" width="21" height="1.4" fill="#f59e0b" opacity=".7" />
    </>
  ),

  calendar: (u, f) => (
    <>
      <defs>
        {lin(u("page"), [[0, "#ffffff"], [1, "#e2e8f0"]])}
        {lin(u("head"), [[0, "#f87171"], [1, "#b91c1c"]])}
      </defs>
      <rect x="6" y="9" width="36" height="34" rx="4" fill={f("page")} stroke="#cbd5e1" />
      <path d="M10 9h28a4 4 0 0 1 4 4v5H6v-5a4 4 0 0 1 4-4z" fill={f("head")} />
      {[14, 22, 30].map((x) => (
        <rect key={x} x={x} y="4.5" width="3" height="8" rx="1.5" fill="#475569" />
      ))}
      {[0, 1, 2, 3].flatMap((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect key={`${r}${c}`} x={10.5 + c * 6} y={22 + r * 5} width="3.4" height="3" rx=".6" fill={r === 2 && c === 3 ? "#ef4444" : "#94a3b8"} />
        ))
      )}
      <circle cx="30.2" cy="33.5" r="3.6" fill="none" stroke="#ef4444" strokeWidth="1.2" />
    </>
  ),

  history: (u, f) => (
    <>
      <defs>
        {lin(u("p"), [[0, "#ffffff"], [1, "#d7dee8"]])}
        {lin(u("clock"), [[0, "#f8fafc"], [1, "#cbd5e1"]])}
      </defs>
      <rect x="12" y="5" width="24" height="31" rx="2" fill="#cbd5e1" transform="rotate(-8 24 20)" />
      <rect x="10" y="8" width="25" height="33" rx="2" fill={f("p")} stroke="#94a3b8" strokeWidth=".7" />
      <rect x="13.5" y="12" width="12" height="2.4" rx="1" fill="#334155" />
      {[17, 20.5, 24, 27.5].map((y) => (
        <rect key={y} x="13.5" y={y} width={y > 25 ? 10 : 18} height="1.4" rx=".7" fill="#94a3b8" />
      ))}
      <circle cx="33" cy="33" r="9" fill={f("clock")} stroke="#334155" strokeWidth="1.8" />
      <path d="M33 27.5V33l3.5 2.2" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),

  camera: (u, f) => (
    <>
      <defs>
        {lin(u("body"), DARK)}
        {rad(u("lens"), [[0, "#60a5fa"], [0.35, "#1e3a8a"], [1, "#020617"]], { cx: 0.4, cy: 0.35, r: 0.7 })}
        {lin(u("ring"), SILVER)}
      </defs>
      <path d="M17 10h14l2.5 5H14.5z" fill="#374151" />
      <rect x="5" y="14" width="38" height="27" rx="4.5" fill={f("body")} />
      <rect x="5" y="20" width="38" height="2" fill="#111827" opacity=".6" />
      <circle cx="24" cy="28" r="10.5" fill={f("ring")} />
      <circle cx="24" cy="28" r="8" fill="#111827" />
      <circle cx="24" cy="28" r="6" fill={f("lens")} />
      <circle cx="21.8" cy="25.8" r="1.6" fill="#fff" opacity=".8" />
      <rect x="34" y="17" width="5.5" height="3" rx="1" fill="#e5e7eb" />
      <circle cx="10" cy="18" r="1.4" fill="#ef4444" />
    </>
  ),

  // ----- Filtros -----
  oilFilter: (u, f) => (
    <>
      <defs>
        {lin(u("can"), [[0, "#1e3a8a"], [0.3, "#3b82f6"], [0.45, "#93c5fd"], [0.7, "#2563eb"], [1, "#1e3a8a"]], { x2: 1, y2: 0 })}
        {lin(u("plate"), SILVER, { x2: 1, y2: 1 })}
      </defs>
      <path d="M10 14v24c0 2.8 6.3 5 14 5s14-2.2 14-5V14z" fill={f("can")} />
      {[20, 26, 32].map((y) => (
        <path key={y} d={`M10 ${y}c0 2.8 6.3 5 14 5s14-2.2 14-5`} fill="none" stroke="#1e3a8a" strokeWidth=".8" opacity=".6" />
      ))}
      <ellipse cx="24" cy="14" rx="14" ry="5.2" fill={f("plate")} stroke="#475569" strokeWidth=".6" />
      {Array.from({ length: 8 }, (_, i) => {
        const [x, y] = pt(24, 14, 1, i * 45);
        return <ellipse key={i} cx={24 + (x - 24) * 8.5} cy={14 + (y - 14) * 3.1} rx="1.3" ry=".7" fill="#1f2937" />;
      })}
      <ellipse cx="24" cy="14" rx="3.2" ry="1.4" fill="#111827" />
    </>
  ),

  airFilter: (u, f) => <PleatedPanel u={u} f={f} top={["#fdba74", "#f97316"]} side="#c2410c" pleat="#9a3412" />,
  cabinFilter: (u, f) => <PleatedPanel u={u} f={f} top={["#ffffff", "#d4dbe4"]} side="#94a3b8" pleat="#94a3b8" />,

  fuelFilter: (u, f) => (
    <>
      <defs>{lin(u("c"), CHROME_H.map(([o, c]) => [o, c]))}</defs>
      <rect x="3" y="21.5" width="10" height="5" rx="1.5" fill={f("c")} />
      <rect x="35" y="21.5" width="10" height="5" rx="1.5" fill={f("c")} />
      <rect x="10" y="15" width="28" height="18" rx="6" fill={f("c")} stroke="#64748b" strokeWidth=".6" />
      <rect x="15" y="15" width="2.2" height="18" fill="#475569" opacity=".7" />
      <rect x="30.8" y="15" width="2.2" height="18" fill="#475569" opacity=".7" />
      <rect x="19.5" y="20.5" width="9" height="7" rx="1" fill="#2563eb" opacity=".85" />
    </>
  ),

  gearbox: (u, f) => (
    <>
      <defs>
        {lin(u("h"), [[0, "#e2e8f0"], [0.5, "#94a3b8"], [1, "#475569"]])}
        {lin(u("b"), [[0, "#cbd5e1"], [1, "#64748b"]], { x2: 1, y2: 0 })}
      </defs>
      <path d="M4 12l15 4v18L4 38z" fill={f("b")} stroke="#475569" strokeWidth=".6" />
      <rect x="18" y="14" width="20" height="22" rx="3" fill={f("h")} stroke="#475569" strokeWidth=".6" />
      <rect x="37" y="20" width="7" height="10" rx="1.5" fill="#64748b" />
      {[20, 25, 30].map((x) => (
        <line key={x} x1={x} y1="16" x2={x} y2="34" stroke="#475569" strokeWidth="1" opacity=".6" />
      ))}
      {[[7, 15], [7, 35], [16, 18], [16, 32]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" fill="#334155" />
      ))}
      <circle cx="31" cy="25" r="4.2" fill="#334155" />
      <circle cx="31" cy="25" r="1.8" fill="#cbd5e1" />
    </>
  ),

  // ----- Serviços -----
  brakes: (u, f) => (
    <>
      <defs>
        {rad(u("disc"), [[0, "#f8fafc"], [0.6, "#cbd5e1"], [1, "#6b7280"]], { cx: 0.45, cy: 0.4, r: 0.65 })}
        {lin(u("cal"), [[0, "#f87171"], [0.5, "#dc2626"], [1, "#7f1d1d"]])}
      </defs>
      <circle cx="22" cy="26" r="19" fill={f("disc")} stroke="#6b7280" strokeWidth=".6" />
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = pt(22, 26, 14, i * 30 + 15);
        return <circle key={i} cx={x} cy={y} r="1" fill="#475569" />;
      })}
      <circle cx="22" cy="26" r="8.5" fill="#64748b" />
      {Array.from({ length: 5 }, (_, i) => {
        const [x, y] = pt(22, 26, 5, i * 72 - 90);
        return <circle key={i} cx={x} cy={y} r="1.2" fill="#1f2937" />;
      })}
      <circle cx="22" cy="26" r="2.4" fill="#1f2937" />
      <path d="M25.6 9.5A17 17 0 0 1 38.8 22.8" fill="none" stroke={f("cal")} strokeWidth="9" strokeLinecap="round" />
      <path d="M28 10.5A15 15 0 0 1 37 19.5" fill="none" stroke="#fecaca" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
    </>
  ),

  tyres: (u, f) => (
    <>
      <defs>
        {rad(u("t"), [[0, "#374151"], [1, "#030712"]], { cx: 0.5, cy: 0.5, r: 0.55 })}
        {lin(u("rim"), SILVER, { x2: 1, y2: 1 })}
      </defs>
      <circle cx="24" cy="24" r="21" fill={f("t")} stroke="#6b7280" strokeWidth="1" />
      <circle cx="24" cy="24" r="19" fill="none" stroke="#6b7280" strokeWidth="3" strokeDasharray="2.6 1.8" />
      <circle cx="24" cy="24" r="13.2" fill="none" stroke="#9ca3af" strokeWidth=".8" />
      <circle cx="24" cy="24" r="12" fill={f("rim")} />
      {Array.from({ length: 5 }, (_, i) => {
        const [x, y] = pt(24, 24, 10.5, i * 72 - 90);
        return <line key={i} x1="24" y1="24" x2={x} y2={y} stroke="#475569" strokeWidth="3" strokeLinecap="round" />;
      })}
      <circle cx="24" cy="24" r="3" fill="#334155" />
    </>
  ),

  battery: (u, f) => (
    <>
      <defs>
        {lin(u("b"), DARK)}
        {lin(u("lid"), [[0, "#6b7280"], [1, "#374151"]])}
      </defs>
      <rect x="10" y="8" width="7" height="6" rx="1" fill="#dc2626" />
      <rect x="31" y="8" width="7" height="6" rx="1" fill="#9ca3af" />
      <rect x="5" y="13" width="38" height="29" rx="3" fill={f("b")} />
      <rect x="5" y="13" width="38" height="6" rx="2" fill={f("lid")} />
      <path d="M11 27h6M14 24v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M31 27h6" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="34" width="30" height="4" rx="1" fill="#f59e0b" />
    </>
  ),

  suspension: (u, f) => (
    <>
      <defs>
        {lin(u("rod"), CHROME_H, { x2: 1, y2: 0 })}
        {lin(u("body"), [[0, "#111827"], [0.4, "#4b5563"], [1, "#111827"]], { x2: 1, y2: 0 })}
      </defs>
      <rect x="18" y="3" width="12" height="4" rx="1.5" fill="#64748b" />
      <rect x="22.2" y="6" width="3.6" height="18" fill={f("rod")} />
      <rect x="19.5" y="24" width="9" height="16" rx="1.5" fill={f("body")} />
      <circle cx="24" cy="42.5" r="3" fill="none" stroke="#475569" strokeWidth="2" />
      <polyline points="14,10 34,13 14,16 34,19 14,22 34,25 14,28 34,31 14,34" fill="none" stroke="#7f1d1d" strokeWidth="3.4" strokeLinejoin="round" />
      {[10, 16, 22, 28].map((y) => (
        <line key={y} x1="14" y1={y} x2="34" y2={y + 3} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      ))}
    </>
  ),

  alignment: (u, f) => (
    <>
      <defs>
        {rad(u("t"), [[0, "#374151"], [1, "#030712"]], { cx: 0.5, cy: 0.5, r: 0.55 })}
        {lin(u("rim"), SILVER, { x2: 1, y2: 1 })}
      </defs>
      <circle cx="24" cy="24" r="15" fill={f("t")} stroke="#6b7280" strokeWidth="1" />
      <circle cx="24" cy="24" r="8.5" fill={f("rim")} />
      <circle cx="24" cy="24" r="2.5" fill="#334155" />
      <line x1="24" y1="2" x2="24" y2="46" stroke="#22c55e" strokeWidth="1.6" strokeDasharray="3 2" />
      <path d="M5 16a21 21 0 0 0 0 16M43 16a21 21 0 0 1 0 16" fill="none" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2.8 29.5L5 33l3-2.6M45.2 29.5L43 33l-3-2.6" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  clutch: (u, f) => (
    <>
      <defs>
        {rad(u("fr"), [[0.55, "#b45309"], [1, "#78350f"]], { cx: 0.5, cy: 0.5, r: 0.5 })}
        {lin(u("pl"), SILVER, { x2: 1, y2: 1 })}
      </defs>
      <circle cx="24" cy="24" r="21" fill={f("fr")} />
      <circle cx="24" cy="24" r="21" fill="none" stroke="#451a03" strokeWidth="1" strokeDasharray="1 3" />
      <circle cx="24" cy="24" r="13" fill={f("pl")} stroke="#475569" strokeWidth=".6" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = i * 60;
        const [x, y] = pt(24, 24, 8.5, a);
        return <rect key={i} x={x - 2.4} y={y - 1.3} width="4.8" height="2.6" rx="1.2" fill="#334155" transform={`rotate(${a + 90} ${x} ${y})`} />;
      })}
      <circle cx="24" cy="24" r="4.3" fill="#1f2937" />
      <circle cx="24" cy="24" r="1.8" fill="#94a3b8" />
    </>
  ),

  timing: (u, f) => (
    <>
      <defs>{lin(u("p"), SILVER, { x2: 1, y2: 1 })}</defs>
      <rect x="2.3" y="16" width="43.4" height="18" rx="9" fill="none" stroke="#374151" strokeWidth="3.6" transform="rotate(45 24 25)" />
      <rect x="2.3" y="16" width="43.4" height="18" rx="9" fill="none" stroke="#9ca3af" strokeWidth="1.4" strokeDasharray="1.2 1.6" transform="rotate(45 24 25)" />
      <circle cx="17.6" cy="18.6" r="8" fill={f("p")} stroke="#475569" strokeWidth=".6" />
      <circle cx="30.4" cy="31.4" r="8" fill={f("p")} stroke="#475569" strokeWidth=".6" />
      <circle cx="17.6" cy="18.6" r="2.6" fill="#334155" />
      <circle cx="30.4" cy="31.4" r="2.6" fill="#334155" />
      <circle cx="36" cy="13" r="4" fill="#f59e0b" stroke="#92400e" strokeWidth=".8" />
    </>
  ),

  cooling: (u, f) => (
    <>
      <defs>{lin(u("j"), [[0, "#fbcfe8"], [0.4, "#f472b6"], [1, "#be185d"]], { x2: 1, y2: 0.4 })}</defs>
      <rect x="14" y="4" width="9" height="6" rx="1.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth=".6" />
      <path d="M13 10h14l9 4v26a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V13a3 3 0 0 1 3-3z" fill={f("j")} />
      <path d="M28 12h3.5a3 3 0 0 1 3 3v6h-3.5v-5H28z" fill="#9d174d" opacity=".6" />
      <path d="M10 26h26" stroke="#fff" strokeWidth=".8" opacity=".6" />
      <path d="M15 14v24" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".35" />
      <path d="M23 29v7M20 33l3 3 3-3" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
    </>
  ),

  sparkPlugs: (u, f) => {
    const plug = (dx, rot) => (
      <g transform={`translate(${24 + dx} 0) rotate(${rot} 0 24)`}>
        <rect x="-1.5" y="3" width="3" height="4" rx="1" fill="#cbd5e1" />
        <rect x="-3.8" y="7" width="7.6" height="16" rx="3" fill={f("cer")} />
        {[11, 14, 17].map((y) => (
          <rect key={y} x="-3.8" y={y} width="7.6" height=".8" fill="#cbd5e1" />
        ))}
        <rect x="-5" y="23" width="10" height="5.5" rx="1" fill={f("hex")} />
        <rect x="-3.2" y="28.5" width="6.4" height="9" fill="#9ca3af" />
        {[30, 32, 34, 36].map((y) => (
          <line key={y} x1="-3.2" y1={y} x2="3.2" y2={y + 1} stroke="#4b5563" strokeWidth=".8" />
        ))}
        <path d="M0 37.5v4M-2.5 41.5h5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
    return (
      <>
        <defs>
          {lin(u("cer"), [[0, "#ffffff"], [0.6, "#e5e7eb"], [1, "#9ca3af"]], { x2: 1, y2: 0 })}
          {lin(u("hex"), CHROME_H, { x2: 1, y2: 0 })}
        </defs>
        {plug(-7, -10)}
        {plug(9, 12)}
      </>
    );
  },

  electric: (u, f) => (
    <>
      <defs>
        {rad(u("al"), [[0, "#f1f5f9"], [0.7, "#94a3b8"], [1, "#475569"]], { cx: 0.4, cy: 0.35, r: 0.7 })}
        {lin(u("bolt"), [[0, "#fde047"], [1, "#f59e0b"]])}
      </defs>
      <circle cx="22" cy="26" r="17" fill={f("al")} stroke="#475569" strokeWidth=".6" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = i * 36;
        const [x, y] = pt(22, 26, 12, a);
        return <rect key={i} x={x - 1} y={y - 3} width="2" height="6" rx="1" fill="#334155" transform={`rotate(${a + 90} ${x} ${y})`} />;
      })}
      <circle cx="22" cy="26" r="6.5" fill="#1f2937" />
      <circle cx="22" cy="26" r="4.5" fill="none" stroke="#6b7280" strokeWidth=".8" />
      <circle cx="22" cy="26" r="1.6" fill="#cbd5e1" />
      <path d="M36 2l-8 13h6l-3 10 10-14h-6.5z" fill={f("bolt")} stroke="#92400e" strokeWidth=".8" strokeLinejoin="round" />
    </>
  ),

  ac: (u, f) => (
    <>
      <defs>{rad(u("bg"), [[0, "#f0f9ff"], [1, "#7dd3fc"]], { cx: 0.4, cy: 0.35, r: 0.7 })}</defs>
      <circle cx="24" cy="24" r="20" fill={f("bg")} stroke="#0284c7" strokeWidth="1" />
      <g stroke="#0369a1" strokeWidth="2.4" strokeLinecap="round" fill="none">
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a} 24 24)`}>
            <line x1="24" y1="9" x2="24" y2="39" />
            <path d="M20 12.5l4 3.5 4-3.5M20 35.5l4-3.5 4 3.5" />
          </g>
        ))}
      </g>
      <circle cx="24" cy="24" r="2.6" fill="#0369a1" />
    </>
  ),

  diagnostic: (u, f) => (
    <>
      <defs>
        {lin(u("case"), [[0, "#fb923c"], [1, "#c2410c"]])}
        {lin(u("scr"), [[0, "#1e3a8a"], [1, "#0f172a"]])}
      </defs>
      <path d="M24 42c0 3 6 4 10 2" fill="none" stroke="#1f2937" strokeWidth="2" />
      <rect x="11" y="3" width="26" height="38" rx="5" fill={f("case")} />
      <rect x="14" y="7" width="20" height="15" rx="1.5" fill={f("scr")} />
      <rect x="16" y="15" width="2.5" height="5" fill="#22c55e" />
      <rect x="20" y="12" width="2.5" height="8" fill="#38bdf8" />
      <rect x="24" y="10" width="2.5" height="10" fill="#facc15" />
      <rect x="28" y="13" width="2.5" height="7" fill="#ef4444" />
      <circle cx="18" cy="29" r="2.4" fill="#1f2937" />
      <circle cx="30" cy="29" r="2.4" fill="#1f2937" />
      <rect x="21" y="27" width="6" height="4" rx="1" fill="#1f2937" />
      <rect x="16" y="34" width="16" height="3" rx="1.5" fill="#7c2d12" opacity=".6" />
      <rect x="33" y="41" width="9" height="6" rx="1.2" fill="#374151" />
    </>
  ),

  engine: (u, f) => (
    <>
      <defs>
        {lin(u("blk"), [[0, "#e2e8f0"], [0.5, "#94a3b8"], [1, "#475569"]])}
        {lin(u("cov"), [[0, "#4b5563"], [1, "#111827"]])}
        {lin(u("pul"), SILVER, { x2: 1, y2: 1 })}
      </defs>
      <rect x="13" y="5" width="20" height="4" rx="1" fill="#64748b" />
      <rect x="21" y="2.5" width="4" height="4" rx="1" fill="#64748b" />
      <rect x="9" y="9" width="30" height="10" rx="2.5" fill={f("cov")} />
      {[13, 18, 23, 28, 33].map((x) => (
        <line key={x} x1={x} y1="11" x2={x} y2="17" stroke="#6b7280" strokeWidth="1" />
      ))}
      <circle cx="35" cy="12.5" r="2" fill="#facc15" />
      <rect x="8" y="19" width="32" height="18" rx="2" fill={f("blk")} stroke="#475569" strokeWidth=".6" />
      <rect x="40" y="22" width="5" height="8" rx="1" fill="#64748b" />
      <rect x="12" y="37" width="24" height="6" rx="2" fill="#374151" />
      <circle cx="10" cy="32" r="6.5" fill={f("pul")} stroke="#475569" strokeWidth=".6" />
      <circle cx="10" cy="32" r="2.2" fill="#334155" />
      {[22, 28, 34].map((x) => (
        <circle key={x} cx={x} cy="27" r="1.2" fill="#475569" />
      ))}
    </>
  ),

  steering: (u, f) => (
    <>
      <defs>
        {lin(u("rim"), [[0, "#9ca3af"], [0.5, "#4b5563"], [1, "#1f2937"]])}
        {rad(u("hub"), [[0, "#6b7280"], [1, "#1f2937"]], { cx: 0.5, cy: 0.4, r: 0.6 })}
      </defs>
      <circle cx="24" cy="24" r="18.5" fill="none" stroke={f("rim")} strokeWidth="5.5" />
      <path d="M6 23h12M30 23h12M24 31v12" stroke="#374151" strokeWidth="5" strokeLinecap="round" />
      <path d="M6 23h12M30 23h12M24 31v12" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
      <circle cx="24" cy="25" r="8" fill={f("hub")} />
      <circle cx="24" cy="25" r="2.6" fill="#cbd5e1" />
      <path d="M10.5 12A18.5 18.5 0 0 1 22 5.6" fill="none" stroke="#e5e7eb" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
    </>
  ),

  exhaust: (u, f) => (
    <>
      <defs>
        {lin(u("m"), CHROME_H)}
        {lin(u("tip"), [[0, "#94a3b8"], [0.35, "#ffffff"], [1, "#475569"]])}
      </defs>
      <rect x="2" y="22" width="10" height="5" rx="1.5" fill="#64748b" />
      <rect x="10" y="14" width="23" height="21" rx="10" fill={f("m")} stroke="#475569" strokeWidth=".6" />
      <path d="M15 14v21M28 14v21" stroke="#475569" strokeWidth=".8" opacity=".6" />
      <rect x="32" y="19" width="11" height="11" rx="2" fill={f("tip")} />
      <ellipse cx="43" cy="24.5" rx="2.2" ry="5.5" fill="#1f2937" />
      <path d="M45 13c2-2 1-4 2.5-5M44 9c1.5-1.5.5-3 1.5-4" stroke="#94a3b8" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".7" />
    </>
  ),

  lights: (u, f) => (
    <>
      <defs>
        {lin(u("h"), [[0, "#4b5563"], [1, "#111827"]])}
        {rad(u("l"), [[0, "#ffffff"], [0.5, "#bae6fd"], [1, "#0369a1"]], { cx: 0.45, cy: 0.4, r: 0.6 })}
      </defs>
      <path d="M4 32c1-10 8-17 21-19l18 2c2 8 0 15-5 19H8z" fill={f("h")} stroke="#94a3b8" strokeWidth="1" />
      <circle cx="17" cy="24" r="6" fill={f("l")} stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="31" cy="23.5" r="5" fill={f("l")} stroke="#cbd5e1" strokeWidth="1" />
      <path d="M9 31.5c9 1 20 1 29-1.5" fill="none" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 31.5c9 1 20 1 29-1.5" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity=".35" />
    </>
  ),

  wipers: () => (
    <>
      <path d="M4 34C10 17 26 9 44 10" fill="none" stroke="#93c5fd" strokeWidth="1" opacity=".5" />
      <g strokeLinecap="round">
        <line x1="10" y1="42" x2="22" y2="16" stroke="#9ca3af" strokeWidth="2" />
        <line x1="13" y1="23" x2="31" y2="10" stroke="#374151" strokeWidth="3.6" />
        <line x1="13" y1="23" x2="31" y2="10" stroke="#9ca3af" strokeWidth="1" />
        <line x1="28" y1="42" x2="38" y2="20" stroke="#9ca3af" strokeWidth="2" />
        <line x1="30" y1="26" x2="45" y2="15" stroke="#374151" strokeWidth="3.6" />
        <line x1="30" y1="26" x2="45" y2="15" stroke="#9ca3af" strokeWidth="1" />
      </g>
      <circle cx="10" cy="42" r="2.4" fill="#6b7280" />
      <circle cx="28" cy="42" r="2.4" fill="#6b7280" />
    </>
  ),

  bodywork: (u, f) => (
    <>
      <defs>
        {lin(u("g"), [[0, "#f87171"], [0.5, "#dc2626"], [1, "#7f1d1d"]])}
        {lin(u("cup"), CHROME_H, { x2: 1, y2: 0 })}
      </defs>
      <rect x="22" y="3" width="11" height="13" rx="3" fill={f("cup")} />
      <rect x="26" y="15" width="3" height="4" fill="#64748b" />
      <path d="M20 31l4 13h6l-3-13z" fill="#1f2937" />
      <path d="M24 31c-1 4 0 6 2 7" fill="none" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="13" y="18" width="27" height="13" rx="4" fill={f("g")} />
      <rect x="6" y="21.5" width="8" height="6" rx="1" fill="#cbd5e1" />
      <circle cx="35" cy="24.5" r="2.4" fill="#fecaca" opacity=".7" />
      {[[3, 19], [2, 24.5], [3, 30], [0.8, 21.5], [0.8, 27.5]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#ef4444" opacity=".6" />
      ))}
    </>
  ),

  inspection: (u, f) => (
    <>
      <defs>
        {lin(u("w"), SILVER, { x2: 1, y2: 1 })}
        {lin(u("ok"), [[0, "#4ade80"], [1, "#15803d"]])}
      </defs>
      <path
        transform="translate(1 1) scale(1.75)"
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        fill={f("w")}
        stroke="#475569"
        strokeWidth=".5"
      />
      <circle cx="35" cy="35" r="10" fill={f("ok")} stroke="#fff" strokeWidth="1.5" />
      <path d="M30.5 35.2l3.2 3.2 6-6.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  other: (u, f) => (
    <>
      <defs>{lin(u("w"), SILVER, { x2: 1, y2: 1 })}</defs>
      <path
        transform="translate(3 3) scale(1.75)"
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        fill={f("w")}
        stroke="#475569"
        strokeWidth=".5"
      />
    </>
  ),

  service: (u, f) => (
    <>
      <defs>
        {lin(u("c"), [[0, "#ffffff"], [1, "#d7dee8"]])}
        {lin(u("w"), SILVER, { x2: 1, y2: 1 })}
      </defs>
      <rect x="9" y="7" width="26" height="35" rx="3" fill={f("c")} stroke="#94a3b8" strokeWidth=".7" />
      <rect x="16" y="4" width="12" height="6" rx="2" fill="#475569" />
      {[16, 23, 30].map((y) => (
        <g key={y}>
          <path d={`M13 ${y}l2 2 3.5-4`} fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="21" y={y - 1} width="10" height="1.6" rx=".8" fill="#94a3b8" />
        </g>
      ))}
      <path
        transform="translate(23 21) scale(1)"
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        fill={f("w")}
        stroke="#334155"
        strokeWidth=".6"
      />
    </>
  ),
};

function PleatedPanel({ u, f, top, side, pleat }) {
  // Painel plissado em perspetiva (filtro de ar / habitáculo).
  const lines = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 10;
    return [5 + 22 * t, 25 - 10 * t, 20 + 22 * t, 33 - 10 * t];
  });
  return (
    <>
      <defs>{lin(u("top"), [[0, top[0]], [1, top[1]]], { x2: 1, y2: 1 })}</defs>
      <path d="M5 25l15 8v6L5 31z" fill={side} />
      <path d="M20 33l22-10v6L20 39z" fill={side} opacity=".8" />
      <path d="M5 25l22-10 15 8-22 10z" fill={f("top")} stroke={pleat} strokeWidth=".8" strokeLinejoin="round" />
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={pleat} strokeWidth=".9" opacity=".75" />
      ))}
    </>
  );
}

export const ICON_NAMES = Object.keys(ART);

export default function PartIcon({ name, size = 40, className = "", title }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  const u = (n) => `pi${raw}${n}`;
  const f = (n) => `url(#${u(n)})`;
  const draw = ART[name] || ART.other;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`shrink-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {draw(u, f)}
    </svg>
  );
}
