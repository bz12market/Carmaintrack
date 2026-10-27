import { Gauge, Droplet, Filter, MessageSquare, CheckCircle2, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { fmtDate, fmtKm } from "../lib/util.js";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-field px-3 py-2.5">
      <Icon size={18} className="shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wider text-subtle uppercase">{label}</p>
        <p className="text-sm text-ink">{value}</p>
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
          <span className="absolute top-5 -left-[33px] h-4 w-4 rounded-full border-4 border-bg bg-brand ring-2 ring-brand/40" />
          <div className="card p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {i === 0 && (
                    <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-semibold text-brand">Mais recente</span>
                  )}
                  <h3 className="font-bold text-ink">{s.title}</h3>
                </div>
                <p className="text-sm text-muted">{fmtDate(s.date)}</p>
              </div>
              {onEdit && (
                <div className="flex gap-1">
                  <button onClick={() => onEdit(s)} className="rounded-lg p-1.5 text-muted hover:bg-ink/10" aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
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
              <p className="mt-3 flex gap-2 border-t border-line/60 pt-3 text-sm text-ink-2">
                <MessageSquare size={16} className="mt-0.5 shrink-0 text-subtle" /> {s.notes}
              </p>
            )}
            {s.extras?.length > 0 && (
              <div className="mt-3 border-t border-line/60 pt-3">
                <p className="mb-1 text-[11px] font-semibold tracking-wider text-subtle uppercase">Serviços adicionais</p>
                <ul className="space-y-1">
                  {s.extras.map((x, j) => (
                    <li key={j} className="flex gap-2 text-sm">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                      <span>
                        <span className="font-semibold text-ink">{x.name}</span>
                        {x.note && <span className="text-muted"> — {x.note}</span>}
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
