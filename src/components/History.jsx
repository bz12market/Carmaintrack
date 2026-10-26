import { Gauge, Droplet, Filter, MessageSquare, CheckCircle2, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { fmtDate, fmtKm } from "../lib/util.js";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-2.5">
      <Icon size={18} className="shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

/** Histórico em timeline. Com onEdit/onDelete mostra ações (painel da oficina). */
export default function History({ services, onEdit, onDelete }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-brand/50 pl-6">
      {services.map((s, i) => (
        <li key={s.id} className="relative">
          <span className="absolute top-5 -left-[33px] h-4 w-4 rounded-full border-4 border-[#0b0d12] bg-brand ring-2 ring-brand/40" />
          <div className="card p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {i === 0 && (
                    <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand">Mais recente</span>
                  )}
                  <h3 className="font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{fmtDate(s.date)}</p>
              </div>
              {onEdit && (
                <div className="flex gap-1">
                  <button onClick={() => onEdit(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10" aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Row icon={Gauge} label="Quilometragem" value={fmtKm(s.km)} />
              {s.oil && <Row icon={Droplet} label="Óleo" value={s.oil} />}
              {s.filters?.length > 0 && <Row icon={Filter} label="Filtros" value={s.filters.join(", ")} />}
            </div>
            {s.notes && (
              <p className="mt-3 flex gap-2 border-t border-white/5 pt-3 text-sm text-slate-300">
                <MessageSquare size={16} className="mt-0.5 shrink-0 text-slate-500" /> {s.notes}
              </p>
            )}
            {s.extras?.length > 0 && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Serviços adicionais</p>
                <ul className="space-y-1">
                  {s.extras.map((x, j) => (
                    <li key={j} className="flex gap-2 text-sm">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                      <span>
                        <span className="font-semibold text-white">{x.name}</span>
                        {x.note && <span className="text-slate-400"> — {x.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(s.next_km || s.next_date) && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-brand">
                <ArrowRight size={14} /> Próxima: {[s.next_km && fmtKm(s.next_km), s.next_date && fmtDate(s.next_date)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
