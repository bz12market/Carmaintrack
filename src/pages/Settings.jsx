import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Check } from "lucide-react";
import { useStore } from "../lib/store.js";
import { SubscriptionPanel } from "./Account.jsx";
import { resizeImage } from "../lib/util.js";
import { Button, Field } from "../components/ui.jsx";
import { Logo } from "../components/Layout.jsx";
import ThemePicker from "../components/ThemePicker.jsx";
import { applyTheme, normalizeTheme } from "../lib/theme.js";

const themeOf = (ws) => normalizeTheme(ws.theme, ws.primary_color);

export default function Settings() {
  const { data, save, subscription } = useStore();
  const [w, setW] = useState(data.workshop);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => setW({ ...w, [k]: e.target.value });
  const num = (k) => (e) => setW({ ...w, [k]: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 });

  // As cores mudam logo (pré-visualização); se sair sem guardar, volta às guardadas.
  const saved = useRef(data.workshop);
  saved.current = data.workshop;
  useEffect(() => () => applyTheme(themeOf(saved.current)), []);

  function setTheme(t) {
    const { id, name, mode, bg, surface, ink, brand, accent } = t;
    setW({ ...w, theme: { id, name, mode, bg, surface, ink, brand, accent }, primary_color: brand });
    applyTheme(t);
  }

  async function pickLogo(e) {
    const file = e.target.files?.[0];
    if (file) setW({ ...w, logo_url: await resizeImage(file, 256, "image/png") });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await save("workshops", { ...w, name: w.name.trim() || "A minha oficina" });
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch (err) {
      alert(err.message || String(err));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-ink">A sua marca</h2>
          <p className="text-sm text-muted">É isto que o cliente vê no histórico digital e nos cartões.</p>
        </div>
        <div className="flex items-center gap-4">
          <Logo workshop={w} size={64} />
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-ink/5 px-3 py-2 text-sm text-ink-2">
              <ImagePlus size={16} /> {w.logo_url ? "Trocar logótipo" : "Carregar logótipo"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
          </label>
          {w.logo_url && (
            <button type="button" onClick={() => setW({ ...w, logo_url: "" })} className="text-subtle hover:text-danger" aria-label="Remover logótipo">
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome da oficina">
            <input className="input" value={w.name} onChange={set("name")} />
          </Field>
          <Field label="Slogan (opcional)">
            <input className="input" value={w.tagline || ""} onChange={set("tagline")} />
          </Field>
          <Field label="Telefone">
            <input className="input" inputMode="tel" value={w.phone || ""} onChange={set("phone")} />
          </Field>
          <Field label="WhatsApp">
            <input className="input" inputMode="tel" value={w.whatsapp || ""} onChange={set("whatsapp")} placeholder="+351 9xx xxx xxx" />
          </Field>
          <Field label="Morada" className="sm:col-span-2">
            <input className="input" value={w.address || ""} onChange={set("address")} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-ink">Cores do painel e do portal</h2>
          <p className="text-sm text-muted">
            Escolha uma paleta ou crie a sua. Aplica-se ao painel, ao portal que o cliente vê e às etiquetas a cores.
          </p>
        </div>
        <ThemePicker value={themeOf(w)} onChange={setTheme} />
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-ink">Revisões e lembretes</h2>
          <p className="text-sm text-muted">
            Valores usados para sugerir a próxima revisão e para decidir quando um veículo está "a vencer".
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Intervalo padrão (km)">
            <input className="input" inputMode="numeric" value={w.default_interval_km} onChange={num("default_interval_km")} />
          </Field>
          <Field label="Intervalo padrão (meses)">
            <input className="input" inputMode="numeric" value={w.default_interval_months} onChange={num("default_interval_months")} />
          </Field>
          <Field label="Avisar quando faltarem (km)">
            <input className="input" inputMode="numeric" value={w.warn_km} onChange={num("warn_km")} />
          </Field>
          <Field label="Avisar quando faltarem (dias)">
            <input className="input" inputMode="numeric" value={w.warn_days} onChange={num("warn_days")} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {ok ? <Check size={16} /> : null} {ok ? "Guardado" : "Guardar alterações"}
        </Button>
      </div>
      <SubscriptionPanel subscription={subscription} />
    </form>
  );
}
