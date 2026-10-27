import { Check, AlertTriangle, Moon, Sun } from "lucide-react";
import { PALETTES, contrast, readableOn } from "../lib/theme.js";

const FIELDS = [
  ["brand", "Cor principal", "Botões, menu ativo, destaques e etiquetas"],
  ["accent", "Cor secundária", "Gradientes e pormenores"],
  ["bg", "Fundo", "Fundo das páginas"],
  ["surface", "Cartões", "Cartões, menus e janelas"],
  ["ink", "Texto", "Títulos e texto principal"],
];

/** Miniatura de uma paleta: fundo, cartão, texto e botões. */
function Swatch({ p }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ background: p.bg }}>
      <div className="flex gap-1.5 p-2">
        <div className="w-1/4 space-y-1 rounded-md p-1.5" style={{ background: p.surface }}>
          <div className="h-1.5 rounded-full" style={{ background: p.brand }} />
          <div className="h-1.5 rounded-full opacity-30" style={{ background: p.ink }} />
          <div className="h-1.5 rounded-full opacity-30" style={{ background: p.ink }} />
        </div>
        <div className="flex-1 space-y-1.5 rounded-md p-1.5" style={{ background: p.surface }}>
          <div className="h-2 w-2/3 rounded-full" style={{ background: p.ink }} />
          <div className="h-1.5 w-1/2 rounded-full opacity-40" style={{ background: p.ink }} />
          <div className="flex gap-1 pt-0.5">
            <div className="h-3 w-8 rounded" style={{ background: p.brand }} />
            <div className="h-3 w-5 rounded" style={{ background: p.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Escolha da paleta: predefinidas ou personalizada.
 * `value` é o tema atual (normalizado) e `onChange` recebe o novo tema.
 */
export default function ThemePicker({ value, onChange }) {
  const isCustom = !PALETTES.some((p) => p.id === value.id);
  const textContrast = contrast(value.ink, value.bg);
  const cardContrast = contrast(value.ink, value.surface);
  const brandContrast = contrast(value.brand, value.surface);
  const warnings = [
    Math.min(textContrast, cardContrast) < 4.5 && "O texto tem pouco contraste com o fundo ou os cartões.",
    brandContrast < 2.2 && "A cor principal quase não se distingue dos cartões.",
  ].filter(Boolean);

  const custom = (patch) => onChange({ ...value, ...patch, id: "custom", name: "Personalizada" });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PALETTES.map((p) => {
          const active = p.id === value.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className={`group rounded-2xl border p-2 text-left transition ${
                active ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-ink/30"
              }`}
              aria-pressed={active}
            >
              <Swatch p={p} />
              <span className="mt-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-ink">
                {p.mode === "dark" ? <Moon size={13} className="text-muted" /> : <Sun size={13} className="text-muted" />}
                {p.name}
                {active && <Check size={15} className="ml-auto text-brand" />}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => custom({})}
          className={`rounded-2xl border border-dashed p-2 text-left transition ${
            isCustom ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-ink/30"
          }`}
          aria-pressed={isCustom}
        >
          <Swatch p={value} />
          <span className="mt-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-ink">
            Personalizada
            {isCustom && <Check size={15} className="ml-auto text-brand" />}
          </span>
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-field p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            {isCustom ? "Paleta personalizada" : `Ajustar a partir de "${value.name}"`}
          </p>
          <div className="flex rounded-full border border-line bg-surface p-0.5 text-xs font-semibold">
            {[
              ["light", "Claro", Sun],
              ["dark", "Escuro", Moon],
            ].map(([m, l, Icon]) => (
              <button
                key={m}
                type="button"
                onClick={() => custom({ mode: m })}
                className={`flex items-center gap-1 rounded-full px-3 py-1 ${value.mode === m ? "bg-brand text-on-brand" : "text-muted"}`}
              >
                <Icon size={12} /> {l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map(([key, label, hint]) => (
            <label key={key} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line" style={{ background: value[key] }}>
                <input
                  type="color"
                  value={value[key]}
                  onChange={(e) => custom({ [key]: e.target.value })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={label}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{label}</span>
                <span className="block truncate text-xs text-muted">{hint}</span>
                <span className="font-mono text-xs text-subtle uppercase">{value[key]}</span>
              </span>
            </label>
          ))}
          <div
            className="flex items-center justify-center rounded-xl p-2.5 text-sm font-bold"
            style={{ background: value.brand, color: readableOn(value.brand) }}
          >
            Botão de exemplo
          </div>
        </div>
        {warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {warnings.map((w) => (
              <p key={w} className="flex items-center gap-2 text-xs font-medium text-warn">
                <AlertTriangle size={14} /> {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
