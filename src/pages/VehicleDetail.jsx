import { useState } from "react";
import {
  ArrowLeft,
  Wrench,
  MessageCircle,
  ExternalLink,
  Copy,
  Pencil,
  Trash2,
  Phone,
  Gauge,
  CalendarClock,
  Check,
  Printer,
  X,
} from "lucide-react";
import { useStore } from "../lib/store.js";
import { navigate, href } from "../lib/router.js";
import { fmtDate, fmtKm, portalUrl, reminderText, shareText, vehicleName, waLink } from "../lib/util.js";
import { Button, Field, Link, Modal, Plate, StatusBadge, VehiclePhoto, Empty } from "../components/ui.jsx";
import History from "../components/History.jsx";

function ClientForm({ client, onClose }) {
  const { save } = useStore();
  const [c, setC] = useState(client);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!c.name.trim()) return;
    setBusy(true);
    await save("clients", c);
    onClose();
  }
  return (
    <Modal title="Editar cliente" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome">
          <input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </Field>
        <Field label="Telemóvel / WhatsApp">
          <input className="input" inputMode="tel" value={c.phone || ""} onChange={(e) => setC({ ...c, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={c.email || ""} onChange={(e) => setC({ ...c, email: e.target.value })} />
        </Field>
        <Field label="Notas internas">
          <textarea className="input" value={c.notes || ""} onChange={(e) => setC({ ...c, notes: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function KmForm({ vehicle, onClose }) {
  const { save } = useStore();
  const [km, setKm] = useState(vehicle.current_km || "");
  async function submit(e) {
    e.preventDefault();
    await save("vehicles", { ...vehicle, current_km: parseInt(String(km).replace(/\D/g, ""), 10) || 0 });
    onClose();
  }
  return (
    <Modal title="Atualizar quilometragem" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Quilometragem atual">
          <input className="input" inputMode="numeric" autoFocus value={km} onChange={(e) => setKm(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function VehicleDetail({ id }) {
  const { data, statuses, clientOf, openRecord, openService, remove } = useStore();
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [labelHint, setLabelHint] = useState(() => new URLSearchParams(window.location.search).get("etiqueta") === "1");
  const v = data.vehicles.find((x) => x.id === id);

  if (!v)
    return (
      <Empty title="Veículo não encontrado">
        <Link to="/veiculos" className="text-brand underline">
          Voltar à lista
        </Link>
      </Empty>
    );

  const st = statuses[v.id];
  const c = clientOf(v);
  const url = portalUrl(v.public_token);
  const needsReminder = st.status === "overdue" || st.status === "soon";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copie o link:", url);
    }
  }

  async function del() {
    if (!confirm(`Eliminar o veículo ${v.plate} e todo o seu histórico? Esta ação não pode ser desfeita.`)) return;
    await remove("vehicles", v.id);
    navigate("/veiculos");
  }

  return (
    <div className="space-y-6">
      {labelHint && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ok/30 bg-ok/10 p-4">
          <Check className="text-ok" size={20} />
          <p className="flex-1 text-sm text-ok">
            Serviço guardado. Imprima a etiqueta com a próxima revisão e cole-a no para-brisas antes de entregar o carro.
          </p>
          <Button onClick={() => navigate(`/cartoes?v=${v.id}`)}>
            <Printer size={16} /> Imprimir etiqueta
          </Button>
          <button
            onClick={() => {
              window.history.replaceState({}, "", href(`/veiculos/${v.id}`));
              setLabelHint(false);
            }}
            className="rounded-lg p-1.5 text-ok/70 hover:bg-ink/10"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      )}
      <Link to="/veiculos" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Clientes e veículos
      </Link>

      <section className="card overflow-hidden">
        <div className="relative">
          <VehiclePhoto vehicle={v} className="h-48 w-full sm:h-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <Plate className="text-3xl text-white sm:text-4xl">{v.plate}</Plate>
            <p className="text-white/85">{vehicleName(v)}</p>
          </div>
          <StatusBadge status={st.status} className="absolute top-3 right-3 !bg-black/60" />
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <p className="label">Proprietário</p>
            {c ? (
              <button onClick={() => setModal({ type: "client" })} className="group text-left">
                <p className="font-semibold text-ink group-hover:underline">{c.name}</p>
                <p className="text-sm text-muted">{c.phone || "sem telemóvel"}</p>
              </button>
            ) : (
              <button onClick={() => openRecord(v)} className="text-sm text-brand underline">
                Associar proprietário
              </button>
            )}
          </div>
          <div>
            <p className="label">Quilometragem atual</p>
            <button onClick={() => setModal({ type: "km" })} className="flex items-center gap-2 font-semibold text-ink hover:underline">
              <Gauge size={16} className="text-muted" /> {fmtKm(v.current_km)}
            </button>
          </div>
          <div>
            <p className="label">Próxima revisão</p>
            <p className="flex items-center gap-2 font-semibold text-ink">
              <CalendarClock size={16} className="text-muted" />
              {[st.nextKm != null && fmtKm(st.nextKm), st.nextDate && fmtDate(st.nextDate)].filter(Boolean).join(" · ") ||
                "—"}
            </p>
            {st.status !== "none" && (
              <p className="text-xs text-subtle">
                {[
                  st.kmLeft != null && (st.kmLeft >= 0 ? `faltam ${fmtKm(st.kmLeft)}` : `passou ${fmtKm(-st.kmLeft)}`),
                  st.daysLeft != null && (st.daysLeft >= 0 ? `faltam ${st.daysLeft} dias` : `há ${-st.daysLeft} dias`),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          <Button onClick={() => openService(v.id)}>
            <Wrench size={16} /> Registar revisão
          </Button>
          <Button
            variant="whatsapp"
            href={waLink(c?.phone, needsReminder ? reminderText(v, st, data.workshop, c?.name) : shareText(v, data.workshop, c?.name))}
          >
            <MessageCircle size={16} /> {needsReminder ? "Enviar lembrete" : "Enviar histórico"}
          </Button>
          <Button variant="ghost" href={url}>
            <ExternalLink size={16} /> Ver portal do cliente
          </Button>
          <Button variant="ghost" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiado" : "Copiar link"}
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/cartoes?v=${v.id}`)}>
            <Printer size={16} /> Imprimir etiqueta
          </Button>
          {c?.phone && (
            <Button variant="ghost" href={`tel:${c.phone.replace(/\s/g, "")}`}>
              <Phone size={16} /> Ligar
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => openRecord(v)}>
            <Pencil size={16} /> Editar
          </Button>
          <Button variant="danger" onClick={del}>
            <Trash2 size={16} />
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
          Histórico de revisões · {st.count} registo{st.count === 1 ? "" : "s"}
        </h2>
        {st.count === 0 ? (
          <Empty icon={Wrench} title="Sem serviços registados">
            <Button className="mt-3" onClick={() => openService(v.id)}>
              Registar o primeiro serviço
            </Button>
          </Empty>
        ) : (
          <History
            services={st.services}
            onEdit={(s) => openService(v.id, s)}
            onDelete={async (s) => {
              if (confirm(`Eliminar o serviço de ${fmtDate(s.date)}?`)) await remove("services", s.id);
            }}
          />
        )}
      </section>

      {modal?.type === "client" && <ClientForm client={c} onClose={() => setModal(null)} />}
      {modal?.type === "km" && <KmForm vehicle={v} onClose={() => setModal(null)} />}
    </div>
  );
}
