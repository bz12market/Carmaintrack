import { useRef, useState } from "react";
import { Check, AlertTriangle, Loader2, Printer, RefreshCw, ExternalLink } from "lucide-react";
import { useStore } from "../lib/store.js";
import Label, { allSizes } from "./Label.jsx";
import { readLabelPrefs } from "../lib/labelPrefs.js";
import { listPrinters, printLabelsDirect, readPrintPrefs, savePrintPrefs, waitForLabels } from "../lib/directPrint.js";
import { Button, Field } from "./ui.jsx";

const DPI_OPTIONS = [
  [203, "203 dpi (8 pontos/mm), a maioria das térmicas"],
  [300, "300 dpi (12 pontos/mm)"],
  [600, "600 dpi"],
];

/**
 * Personalizar → Impressão direta. A configuração fica neste computador,
 * porque a impressora está ligada a ele.
 */
export default function PrintSetup() {
  const { data, statuses } = useStore();
  const [prefs, setPrefsState] = useState(readPrintPrefs);
  const [printers, setPrinters] = useState(prefs.printer ? [prefs.printer] : []);
  const [state, setState] = useState(null); // { busy } | { ok } | { error }
  const [testing, setTesting] = useState(false);
  const testRef = useRef(null);

  const setPrefs = (patch) => {
    const next = { ...prefs, ...patch };
    if (!next.printer) next.enabled = false;
    setPrefsState(next);
    savePrintPrefs(next);
  };

  async function findPrinters() {
    setState({ busy: "A procurar impressoras…" });
    try {
      const found = await listPrinters();
      setPrinters(found);
      setState(found.length ? { ok: `${found.length} impressora(s) encontrada(s).` } : { error: "O QZ Tray não encontrou impressoras." });
    } catch (err) {
      setState({ error: err.message || String(err) });
    }
  }

  const labelPrefs = readLabelPrefs();
  const sizes = allSizes(data.workshop);
  const size = sizes.find((s) => s.id === labelPrefs.size) || sizes[0];
  const sample = data.vehicles[0];

  async function testPrint() {
    setTesting(true);
    setState({ busy: "A enviar a etiqueta de teste…" });
    try {
      // Espera que a etiqueta de teste seja desenhada fora do ecrã.
      await new Promise((r) => requestAnimationFrame(r));
      const nodes = await waitForLabels(testRef.current);
      const { printer } = await printLabelsDirect(nodes, { size, mode: labelPrefs.mode, copies: 1 });
      setState({ ok: `Etiqueta de teste (${size.name}) enviada para ${printer}.` });
    } catch (err) {
      setState({ error: err.message || String(err) });
    }
    setTesting(false);
  }

  return (
    <section id="impressao" className="card scroll-mt-20 space-y-4 p-5">
      <div>
        <h2 className="font-bold text-ink">Impressão direta (neste computador)</h2>
        <p className="text-sm text-muted">
          Envia as etiquetas diretamente para a impressora de etiquetas, sem abrir a janela de impressão. Os browsers não o
          permitem sozinhos, por isso usa o <b className="text-ink">QZ Tray</b>, um programa gratuito que se instala uma vez
          neste computador. Esta configuração fica só neste computador.
        </p>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
        <li>
          Instale e abra o QZ Tray:{" "}
          <a href="https://qz.io/download/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
            qz.io/download <ExternalLink size={12} />
          </a>
          .
        </li>
        <li>Carregue em "Procurar impressoras" e, se o QZ Tray pedir, escolha "Allow" (permitir).</li>
        <li>Escolha a impressora de etiquetas e ligue "Imprimir diretamente".</li>
      </ol>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Impressora de etiquetas">
          <select className="input" value={prefs.printer} onChange={(e) => setPrefs({ printer: e.target.value })}>
            <option value="">— Escolher —</option>
            {printers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Button variant="ghost" onClick={findPrinters} disabled={!!state?.busy}>
          <RefreshCw size={16} /> Procurar impressoras
        </Button>
      </div>

      <Field label="Resolução da impressora">
        <select className="input" value={prefs.dpi} onChange={(e) => setPrefs({ dpi: Number(e.target.value) })}>
          {DPI_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>

      <label className={`flex items-center gap-2 text-sm ${prefs.printer ? "text-ink" : "text-subtle"}`}>
        <input
          type="checkbox"
          checked={prefs.enabled}
          disabled={!prefs.printer}
          onChange={(e) => setPrefs({ enabled: e.target.checked })}
          className="accent-[var(--brand)]"
        />
        Imprimir diretamente (sem janela de impressão)
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={testPrint} disabled={!prefs.printer || !sample || testing}>
          <Printer size={16} /> Imprimir etiqueta de teste
        </Button>
        <span className="text-xs text-muted">
          Usa o tamanho e o modo escolhidos em "Etiquetas e QR" ({size.name}).
        </span>
      </div>

      {state?.busy && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> {state.busy}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-xl bg-ok/10 px-3 py-2 text-sm text-ok">
          <Check size={16} /> {state.ok}
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle size={16} /> {state.error}
        </p>
      )}

      <details className="rounded-xl border border-line bg-field px-4 py-3 text-sm text-ink-2">
        <summary className="cursor-pointer font-semibold text-ink">Alternativa sem instalar nada (Google Chrome)</summary>
        <div className="mt-2 space-y-1">
          <p>
            O Chrome tem um modo que imprime sem janela, na <b>impressora predefinida</b> do computador. Serve se a impressora
            de etiquetas for a predefinida (e o papel estiver configurado com o tamanho da etiqueta).
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Defina a impressora de etiquetas como predefinida no Windows ou no macOS.</li>
            <li>Crie um atalho do Chrome e, no fim do campo "Destino", acrescente <code className="rounded bg-ink/5 px-1">--kiosk-printing</code>.</li>
            <li>Feche todas as janelas do Chrome e abra a app por esse atalho.</li>
          </ol>
          <p>Com isto, deixe "Imprimir diretamente" desligado: o botão Imprimir passa a imprimir logo, sem perguntar.</p>
        </div>
      </details>

      {/* Etiqueta de teste, fora do ecrã, convertida em imagem para imprimir. */}
      {testing && sample && (
        <div ref={testRef} aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0 }}>
          <Label vehicle={sample} workshop={data.workshop} status={statuses[sample.id]} size={size} mode={labelPrefs.mode} />
        </div>
      )}
    </section>
  );
}
