import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LABEL_SIZES, customSizeError, customSizes, isVertical } from "./Label.jsx";
import { Button, Field } from "./ui.jsx";

/** Retângulo proporcional ao tamanho da etiqueta (pré-visualização). */
function Shape({ w, h, max = 44 }) {
  const k = max / Math.max(w, h);
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: max, height: max }}>
      <span className="rounded-[3px] border-2 border-brand bg-brand/10" style={{ width: w * k, height: h * k }} />
    </span>
  );
}

/**
 * Tamanhos de etiqueta personalizados da oficina (Personalizar → Etiquetas).
 * `value` é a lista guardada em workshops.label_sizes; `onChange` recebe a nova lista.
 */
export default function LabelSizes({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState({ w: "", h: "", name: "" });
  const [err, setErr] = useState("");
  const shown = customSizes({ label_sizes: list });

  function add() {
    setErr("");
    const w = Math.round(Number(String(draft.w).replace(",", ".")));
    const h = Math.round(Number(String(draft.h).replace(",", ".")));
    const invalid = customSizeError(w, h);
    if (invalid) return setErr(invalid);
    if ([...LABEL_SIZES, ...shown].some((s) => s.w === w && s.h === h))
      return setErr(`O tamanho ${w} × ${h} mm já existe na lista.`);
    onChange([...list, { w, h, name: draft.name.trim().slice(0, 40) }]);
    setDraft({ w: "", h: "", name: "" });
  }

  const remove = (s) => onChange(list.filter((x) => !(Math.round(x.w) === s.w && Math.round(x.h) === s.h)));

  const dw = Number(draft.w);
  const dh = Number(draft.h);

  return (
    <div className="space-y-4">
      {shown.length > 0 ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-2">
              <Shape w={s.w} h={s.h} max={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{s.name}</p>
                <p className="truncate text-xs text-muted">{s.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(s)}
                className="rounded-lg p-1.5 text-subtle hover:bg-danger/10 hover:text-danger"
                aria-label={`Remover ${s.name}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Ainda não há tamanhos personalizados.</p>
      )}

      <div className="rounded-xl border border-line bg-field p-3">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_2fr_auto_auto]">
          <Field label="Largura (mm)">
            <input
              className="input"
              inputMode="decimal"
              placeholder="70"
              value={draft.w}
              onChange={(e) => setDraft({ ...draft, w: e.target.value })}
            />
          </Field>
          <Field label="Altura (mm)">
            <input
              className="input"
              inputMode="decimal"
              placeholder="40"
              value={draft.h}
              onChange={(e) => setDraft({ ...draft, h: e.target.value })}
            />
          </Field>
          <Field label="Nome (opcional)">
            <input
              className="input"
              placeholder="Ex.: Rolo da Zebra"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <span className="hidden sm:block">{dw > 0 && dh > 0 ? <Shape w={dw} h={dh} /> : <Shape w={1} h={1} />}</span>
          <Button variant="ghost" onClick={add}>
            <Plus size={16} /> Adicionar
          </Button>
        </div>
        {dw > 0 && dh > 0 && !err && (
          <p className="mt-2 text-xs text-muted">
            Etiqueta {isVertical({ w: dw, h: dh }) ? "vertical" : "horizontal"}: largura × altura tal como sai da impressora.
          </p>
        )}
        {err && <p className="mt-2 text-xs font-medium text-danger">{err}</p>}
      </div>
    </div>
  );
}
