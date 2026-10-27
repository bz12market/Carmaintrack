import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Sparkles } from "lucide-react";
import { useStore } from "../lib/store.js";
import { navigate } from "../lib/router.js";
import { resetDemo } from "../lib/db.js";
import { GoLink } from "./Brand.jsx";

const KEY = "carmaintrack-demo-guide";

/** Barra da demonstração: explica o que é e propõe um percurso curto. */
export default function DemoGuide() {
  const { data, openService } = useStore();
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "closed";
    } catch {
      return true;
    }
  });
  const toggle = () => {
    setOpen(!open);
    try {
      localStorage.setItem(KEY, open ? "closed" : "open");
    } catch {
      /* ignora */
    }
  };

  // O visitante pode apagar veículos; usa o primeiro que existir.
  const v = data.vehicles.find((x) => x.id === "v1") || data.vehicles[0];
  const steps = [
    { label: "Veja o painel e os alertas", run: () => navigate("/") },
    v && { label: `Abra a ficha do ${v.plate}`, run: () => navigate(`/veiculos/${v.id}`) },
    v && { label: "Registe uma revisão", run: () => (navigate(`/veiculos/${v.id}`), openService(v.id)) },
    v && { label: "Imprima a etiqueta com QR", run: () => navigate(`/cartoes?v=${v.id}`) },
    v && { label: "Veja o que o cliente vê", run: () => window.open(`/demo/v/${v.public_token}`, "_blank") },
  ].filter(Boolean);

  return (
    <div className="demo-guide no-print border-b border-brand/25 bg-gradient-to-r from-brand/15 via-accent/10 to-transparent">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-brand">
          <Sparkles size={16} /> Demonstração
          <span className="hidden font-normal text-muted sm:inline">· dados fictícios, guardados só neste browser</span>
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Repor os dados de exemplo da demonstração?")) {
                resetDemo();
                window.location.reload();
              }
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-ink/10"
          >
            <RotateCcw size={13} /> Repor
          </button>
          <GoLink to="/#precos" className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-on-brand hover:brightness-110">
            Subscrever
          </GoLink>
          <button onClick={toggle} className="rounded-lg p-1 text-muted hover:bg-ink/10" aria-label="Mostrar/esconder guia">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
        {open && (
          <ol className="flex w-full gap-2 overflow-x-auto pb-1">
            {steps.map((s, i) => (
              <li key={s.label} className="shrink-0">
                <button
                  onClick={s.run}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 text-xs text-ink hover:border-brand/50"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-on-brand">
                    {i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
