import { useState } from "react";
import { ImagePlus, Trash2, Check } from "lucide-react";
import { useStore } from "../lib/store.js";
import { SubscriptionPanel } from "./Account.jsx";
import { resizeImage } from "../lib/util.js";
import { Button, Field } from "../components/ui.jsx";
import { Logo } from "../components/Layout.jsx";

const COLORS = ["#f97316", "#dc2626", "#2563eb", "#16a34a", "#7c3aed", "#0891b2", "#db2777", "#ca8a04"];

export default function Settings() {
  const { data, save, subscription } = useStore();
  const [w, setW] = useState(data.workshop);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => setW({ ...w, [k]: e.target.value });
  const num = (k) => (e) => setW({ ...w, [k]: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 });

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
          <h2 className="font-bold text-white">A sua marca</h2>
          <p className="text-sm text-slate-400">É isto que o cliente vê no histórico digital e nos cartões.</p>
        </div>
        <div className="flex items-center gap-4">
          <Logo workshop={w} size={64} />
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
              <ImagePlus size={16} /> {w.logo_url ? "Trocar logótipo" : "Carregar logótipo"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
          </label>
          {w.logo_url && (
            <button type="button" onClick={() => setW({ ...w, logo_url: "" })} className="text-slate-500 hover:text-red-300" aria-label="Remover logótipo">
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
        <div>
          <span className="label">Cor principal</span>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setW({ ...w, primary_color: c })}
                className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-[#0b0d12]"
                style={{ background: c, boxShadow: w.primary_color === c ? `0 0 0 2px #0b0d12, 0 0 0 4px ${c}` : "none" }}
                aria-label={c}
              >
                {w.primary_color === c && <Check size={16} className="text-white" />}
              </button>
            ))}
            <input
              type="color"
              value={w.primary_color}
              onChange={set("primary_color")}
              className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
              title="Outra cor"
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-white">Revisões e lembretes</h2>
          <p className="text-sm text-slate-400">
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
