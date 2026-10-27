// Paletas de cores do painel e do portal do cliente.
// Cada paleta define 6 cores; as restantes (texto secundário, linhas, campos)
// são derivadas em CSS (index.css) a partir destas.

export const PALETTES = [
  { id: "petroleo", name: "Petróleo", mode: "light", bg: "#eef3f2", surface: "#ffffff", ink: "#10282f", brand: "#0f766e", accent: "#65a30d" },
  { id: "oceano", name: "Oceano", mode: "light", bg: "#eef2f9", surface: "#ffffff", ink: "#111c33", brand: "#2563eb", accent: "#0891b2" },
  { id: "ameixa", name: "Ameixa", mode: "light", bg: "#f4f0f7", surface: "#ffffff", ink: "#24162e", brand: "#7c3aed", accent: "#db2777" },
  { id: "areia", name: "Areia", mode: "light", bg: "#f5f0e7", surface: "#fffdf8", ink: "#2b2117", brand: "#b45309", accent: "#0f766e" },
  { id: "grafite", name: "Grafite", mode: "dark", bg: "#111418", surface: "#1a1f26", ink: "#e6ebef", brand: "#06b6d4", accent: "#a3e635" },
  { id: "floresta", name: "Floresta", mode: "dark", bg: "#0c1411", surface: "#14211c", ink: "#e2eee7", brand: "#10b981", accent: "#f59e0b" },
  { id: "meia-noite", name: "Meia-noite", mode: "dark", bg: "#0b1020", surface: "#141b31", ink: "#e5e9f6", brand: "#6366f1", accent: "#38bdf8" },
];

export const DEFAULT_THEME = PALETTES[0];

/** Identidade do produto na landing page (não muda com as paletas). */
export const MARKETING_THEME = {
  mode: "light",
  bg: "#f3f7f5",
  surface: "#ffffff",
  ink: "#0b2230",
  brand: "#0f766e",
  accent: "#84cc16",
};

const COLOR_KEYS = ["bg", "surface", "ink", "brand", "accent"];
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

// Cor por defeito das oficinas criadas antes das paletas existirem.
const LEGACY_DEFAULT_BRAND = "#f97316";

/**
 * Tema válido a partir do que está guardado na oficina. Sem tema guardado,
 * usa a paleta por defeito com a cor principal antiga (se tiver sido mudada).
 */
export function normalizeTheme(saved, legacyBrand) {
  if (saved && typeof saved === "object") {
    const base = PALETTES.find((p) => p.id === saved.id) || DEFAULT_THEME;
    const out = { ...base, id: saved.id || "custom", name: saved.name || base.name };
    for (const k of COLOR_KEYS) if (isHex(saved[k])) out[k] = saved[k];
    out.mode = saved.mode === "dark" ? "dark" : saved.mode === "light" ? "light" : base.mode;
    return out;
  }
  const legacy = isHex(legacyBrand) ? legacyBrand.toLowerCase() : "";
  if (legacy && legacy !== LEGACY_DEFAULT_BRAND && legacy !== DEFAULT_THEME.brand)
    return { ...DEFAULT_THEME, id: "custom", name: "Personalizada", brand: legacyBrand };
  return DEFAULT_THEME;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre duas cores (1 a 21). */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Texto (branco ou quase preto) que se lê melhor sobre `hex`. */
export const readableOn = (hex) => (contrast(hex, "#ffffff") >= contrast(hex, "#111111") ? "#ffffff" : "#111111");

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** Mistura `a` com `b` (t = peso de `a`, de 0 a 1). */
function mix(a, b, t) {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((c, i) => c * t + y[i] * (1 - t)));
}

/**
 * Todas as cores de um tema, já calculadas. As derivadas são calculadas aqui
 * (e não com color-mix() em CSS) para funcionarem em browsers mais antigos.
 */
export function themeColors(t) {
  return {
    bg: t.bg,
    surface: t.surface,
    ink: t.ink,
    brand: t.brand,
    accent: t.accent,
    "on-brand": readableOn(t.brand),
    "on-accent": readableOn(t.accent),
    "ink-2": mix(t.ink, t.bg, 0.84),
    muted: mix(t.ink, t.bg, 0.64),
    subtle: mix(t.ink, t.bg, 0.48),
    line: mix(t.ink, t.surface, 0.14),
    field: mix(t.ink, t.surface, 0.04),
    // Cores de estado: escurecem no tema claro e clareiam no escuro.
    ok: mix("#16a34a", t.ink, 0.74),
    warn: mix("#d97706", t.ink, 0.74),
    danger: mix("#dc2626", t.ink, 0.74),
    info: mix("#0284c7", t.ink, 0.74),
  };
}

/**
 * Variáveis CSS de um tema (para aplicar à página ou a um elemento).
 * Cada cor tem também a versão "-rgb" (p.ex. "15 118 110"), usada pelas
 * transparências do Tailwind (ver o plugin em vite.config.js).
 */
export function themeVars(t) {
  const vars = { colorScheme: t.mode };
  for (const [name, hex] of Object.entries(themeColors(t))) {
    const v = name === "brand" ? "--brand" : `--c-${name}`;
    vars[v] = hex;
    vars[`${v}-rgb`] = toRgb(hex).join(" ");
  }
  return vars;
}

export function applyTheme(t) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(t))) {
    if (k === "colorScheme") root.style.colorScheme = v;
    else root.style.setProperty(k, v);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.bg);
}
