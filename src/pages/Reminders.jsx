import { useState } from "react";
import { BellOff, MessageCircle, Phone, CheckCircle2 } from "lucide-react";
import { useStore } from "../lib/store.js";
import { fmtDate, fmtKm, reminderText, vehicleName, waLink } from "../lib/util.js";
import { Button, Empty, Link, Plate, StatusBadge, VehiclePhoto } from "../components/ui.jsx";

// Guarda (só neste browser) quando foi enviado o último lembrete de cada veículo.
const SENT_KEY = "carmaintrack-reminders-sent";
function readSent() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY)) || {};
  } catch {
    return {};
  }
}

export default function Reminders() {
  const { data, statuses, clientOf } = useStore();
  const [sent, setSent] = useState(readSent);
  const [tab, setTab] = useState("pending");

  const due = data.vehicles
    .filter((v) => v.reminders_enabled !== false && ["overdue", "soon"].includes(statuses[v.id].status))
    .sort((a, b) => {
      const sa = statuses[a.id];
      const sb = statuses[b.id];
      if (sa.status !== sb.status) return sa.status === "overdue" ? -1 : 1;
      return (sa.daysLeft ?? 9e9) - (sb.daysLeft ?? 9e9) || (sa.kmLeft ?? 9e9) - (sb.kmLeft ?? 9e9);
    });

  const lastSent = (v) => sent[`${v.id}:${statuses[v.id].last?.id}`];
  const list = due.filter((v) => (tab === "pending" ? !lastSent(v) : !!lastSent(v)));

  function markSent(v) {
    const next = { ...sent, [`${v.id}:${statuses[v.id].last?.id}`]: new Date().toISOString() };
    setSent(next);
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Veículos com a revisão atrasada ou a menos de {fmtKm(data.workshop.warn_km)} / {data.workshop.warn_days} dias.
        O lembrete abre o WhatsApp com a mensagem já escrita e o link do histórico.
      </p>
      <div className="flex gap-1.5">
        {[
          ["pending", `Por enviar (${due.filter((v) => !lastSent(v)).length})`],
          ["sent", `Enviados (${due.filter((v) => lastSent(v)).length})`],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${tab === k ? "bg-brand text-white" : "bg-white/5 text-slate-400"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty icon={tab === "pending" ? CheckCircle2 : BellOff} title={tab === "pending" ? "Tudo em dia!" : "Nenhum lembrete enviado"}>
          {tab === "pending" && "Não há lembretes por enviar neste momento."}
        </Empty>
      ) : (
        <div className="space-y-3">
          {list.map((v) => {
            const st = statuses[v.id];
            const c = clientOf(v);
            const sentAt = lastSent(v);
            return (
              <div key={v.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Link to={`/veiculos/${v.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <VehiclePhoto vehicle={v} className="h-14 w-20 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Plate className="text-white">{v.plate}</Plate>
                      <StatusBadge status={st.status} />
                    </div>
                    <p className="truncate text-sm text-slate-400">
                      {vehicleName(v)} · {c?.name || "sem proprietário"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Próxima: {[st.nextKm != null && fmtKm(st.nextKm), st.nextDate && fmtDate(st.nextDate)].filter(Boolean).join(" · ")}
                      {" · "}atual {fmtKm(v.current_km)}
                      {sentAt && ` · enviado a ${fmtDate(sentAt)}`}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  {c?.phone ? (
                    <>
                      <Button
                        variant="whatsapp"
                        href={waLink(c.phone, reminderText(v, st, data.workshop, c.name))}
                        onClick={() => markSent(v)}
                      >
                        <MessageCircle size={16} /> Lembrete
                      </Button>
                      <Button variant="ghost" href={`tel:${c.phone.replace(/\s/g, "")}`} className="!px-3" aria-label="Ligar">
                        <Phone size={16} />
                      </Button>
                    </>
                  ) : (
                    <span className="rounded-xl bg-sky-500/10 px-3 py-2 text-xs text-sky-200">Sem WhatsApp registado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
