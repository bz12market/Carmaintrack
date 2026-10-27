import { useState } from "react";
import QRCode from "qrcode";
import { Printer, Download, Search, Info } from "lucide-react";
import { useStore } from "../lib/store.js";
import { portalUrl, vehicleName } from "../lib/util.js";
import { Empty, Plate } from "../components/ui.jsx";
import Label, { LABEL_SIZES } from "../components/Label.jsx";

// As opções de impressão dependem da impressora deste computador,
// por isso ficam guardadas no browser e não na conta.
const PREFS_KEY = "carmaintrack-label-prefs";
const DEFAULT_PREFS = { size: "100x60", mode: "mono", paper: "roll", copies: 1 };

function readPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function Choice({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([k, l]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${value === k ? "bg-brand text-on-brand" : "bg-ink/5 text-ink-2"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Cards() {
  const { data, statuses, clientOf } = useStore();
  const initial = new URLSearchParams(window.location.search).get("v");
  const [selected, setSelected] = useState(() => new Set(initial ? [initial] : []));
  const [q, setQ] = useState("");
  const [prefs, setPrefsState] = useState(readPrefs);

  const setPrefs = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefsState(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  };

  const size = LABEL_SIZES.find((s) => s.id === prefs.size) || LABEL_SIZES[0];
  const needle = q.trim().toLowerCase().replace(/-/g, "");
  const list = [...data.vehicles]
    .sort((a, b) => a.plate.localeCompare(b.plate))
    .filter(
      (v) =>
        !needle ||
        [v.plate.replace(/-/g, ""), v.make, v.model, clientOf(v)?.name]
          .filter(Boolean)
          .some((t) => t.toLowerCase().includes(needle))
    );
  const chosen = data.vehicles.filter((v) => selected.has(v.id));
  const copies = Math.max(1, Math.min(20, prefs.copies || 1));
  const toPrint = chosen.flatMap((v) => Array.from({ length: copies }, (_, i) => ({ v, key: `${v.id}-${i}` })));

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function download(v) {
    const url = await QRCode.toDataURL(portalUrl(v.public_token), { margin: 2, width: 1024 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${v.plate}.png`;
    a.click();
  }

  if (data.vehicles.length === 0) return <Empty title="Ainda não há veículos" />;

  // Rolo: cada etiqueta é uma página com o tamanho exato da etiqueta.
  // A4: etiquetas lado a lado numa folha de autocolantes.
  const pageCss =
    prefs.paper === "roll"
      ? `@page { size: ${size.w}mm ${size.h}mm; margin: 0; }
         .print-sheet .carmaintrack-label { break-after: page; page-break-after: always; border-radius: 0 !important; }
         .print-sheet .carmaintrack-label:last-child { break-after: auto; page-break-after: auto; }`
      : `@page { size: A4; margin: 8mm; }
         .print-sheet { display: flex !important; flex-wrap: wrap; gap: 3mm; }
         .print-sheet .carmaintrack-label { break-inside: avoid; }`;

  return (
    <div className="space-y-6">
      <style>{`@media print { ${pageCss} }`}</style>

      <div className="print:hidden space-y-5">
        <p className="text-sm text-muted">
          Cada veículo tem um código QR único que abre o seu histórico digital. Imprima a etiqueta e cole-a no interior do
          para-brisas, em vez do autocolante de papel, ou entregue-a como cartão.
        </p>

        <section className="card grid gap-4 p-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <span className="label">Tipo de impressora</span>
              <Choice
                value={prefs.mode}
                onChange={(mode) => setPrefs({ mode })}
                options={[
                  ["mono", "Térmica (preto e branco)"],
                  ["color", "A cores"],
                ]}
              />
            </div>
            <div>
              <span className="label">Papel</span>
              <Choice
                value={prefs.paper}
                onChange={(paper) => setPrefs({ paper })}
                options={[
                  ["roll", "Rolo de etiquetas"],
                  ["a4", "Folha A4 de autocolantes"],
                ]}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="label">Tamanho da etiqueta</span>
              <select className="input" value={prefs.size} onChange={(e) => setPrefs({ size: e.target.value })}>
                {LABEL_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.hint}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Cópias por veículo</span>
              <input
                className="input w-24"
                type="number"
                min={1}
                max={20}
                value={prefs.copies}
                onChange={(e) => setPrefs({ copies: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>
          <p className="flex gap-2 rounded-xl bg-info/10 p-3 text-xs text-info lg:col-span-2">
            <Info size={16} className="shrink-0" />
            {prefs.paper === "roll"
              ? `Na janela de impressão escolha a impressora de etiquetas, papel ${size.w} × ${size.h} mm, margens "Nenhuma", escala 100% e desative "Cabeçalhos e rodapés".`
              : 'Na janela de impressão escolha papel A4, escala 100% e desative "Cabeçalhos e rodapés". Use folhas de autocolantes para exterior/vidro.'}
            {prefs.mode === "mono" && " As impressoras térmicas só imprimem a preto: este modo evita fundos escuros."}
          </p>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-subtle" size={18} />
            <input className="input pl-10" placeholder="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={toPrint.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-50"
          >
            <Printer size={16} /> Imprimir {toPrint.length || ""} etiqueta{toPrint.length === 1 ? "" : "s"}
          </button>
        </div>

        <div className="card divide-y divide-line">
          {list.map((v) => (
            <label key={v.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-ink/[0.03]">
              <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} className="accent-[var(--brand)]" />
              <Plate className="text-ink">{v.plate}</Plate>
              <span className="flex-1 truncate text-sm text-muted">
                {vehicleName(v)} · {clientOf(v)?.name || "—"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  download(v);
                }}
                className="rounded-lg p-1.5 text-muted hover:bg-ink/10"
                title="Descarregar QR (PNG)"
              >
                <Download size={16} />
              </button>
            </label>
          ))}
        </div>

        {chosen.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">Pré-visualização (tamanho real)</h2>
            <div className="flex flex-wrap gap-4 overflow-x-auto rounded-2xl bg-[#e2e8f0] p-4">
              {chosen.map((v) => (
                <Label key={v.id} vehicle={v} workshop={data.workshop} status={statuses[v.id]} size={size} mode={prefs.mode} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Só aparece na impressão */}
      <div className="print-sheet hidden print:block">
        {toPrint.map(({ v, key }) => (
          <Label key={key} vehicle={v} workshop={data.workshop} status={statuses[v.id]} size={size} mode={prefs.mode} />
        ))}
      </div>
    </div>
  );
}
