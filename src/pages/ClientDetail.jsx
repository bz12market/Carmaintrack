import { ArrowLeft, Pencil, Trash2, Phone, Mail, MessageCircle, Car, Plus } from "lucide-react";
import { useStore } from "../lib/store.js";
import { navigate } from "../lib/router.js";
import { fmtKm, vehicleName, waLink } from "../lib/util.js";
import { Button, Empty, Link, Plate, StatusBadge, VehiclePhoto } from "../components/ui.jsx";

export default function ClientDetail({ id }) {
  const { data, statuses, openClient, openRecord, remove } = useStore();
  const c = data.clients.find((x) => x.id === id);

  if (!c)
    return (
      <Empty title="Cliente não encontrado">
        <Link to="/clientes" className="text-brand underline">
          Voltar à lista
        </Link>
      </Empty>
    );

  const vehicles = data.vehicles.filter((v) => v.client_id === c.id).sort((a, b) => a.plate.localeCompare(b.plate));

  async function del() {
    const extra = vehicles.length ? ` Os ${vehicles.length} veículo(s) e o histórico ficam guardados, sem proprietário.` : "";
    if (!confirm(`Eliminar o cliente ${c.name}?${extra}`)) return;
    await remove("clients", c.id);
    navigate("/clientes");
  }

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Clientes
      </Link>

      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-2xl font-bold text-brand">
            {c.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-ink">{c.name}</h1>
            <div className="mt-1 space-y-0.5 text-sm text-muted">
              <p className="flex items-center gap-1.5">
                <Phone size={14} /> {c.phone || "sem telemóvel"}
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={14} /> {c.email || "sem email"}
              </p>
            </div>
          </div>
        </div>
        {c.notes && <p className="rounded-xl bg-field px-3 py-2 text-sm text-ink-2">{c.notes}</p>}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button onClick={() => openClient(c)}>
            <Pencil size={16} /> Editar dados
          </Button>
          {c.phone && (
            <>
              <Button variant="whatsapp" href={waLink(c.phone, `Olá ${c.name.split(" ")[0]}! Aqui é da ${data.workshop.name}.`)}>
                <MessageCircle size={16} /> WhatsApp
              </Button>
              <Button variant="ghost" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                <Phone size={16} /> Ligar
              </Button>
            </>
          )}
          <div className="flex-1" />
          <Button variant="danger" onClick={del} aria-label="Eliminar cliente">
            <Trash2 size={16} />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">Veículos · {vehicles.length}</h2>
          <Button variant="ghost" onClick={() => openRecord(undefined, c.id)}>
            <Plus size={16} /> Adicionar veículo
          </Button>
        </div>
        {vehicles.length === 0 ? (
          <Empty icon={Car} title="Este cliente ainda não tem veículos" />
        ) : (
          <div className="card divide-y divide-line">
            {vehicles.map((v) => (
              <Link key={v.id} to={`/veiculos/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.03]">
                <VehiclePhoto vehicle={v} className="h-12 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Plate className="text-ink">{v.plate}</Plate>
                  <p className="truncate text-sm text-muted">
                    {vehicleName(v) || "—"} · {fmtKm(v.current_km)}
                  </p>
                </div>
                <StatusBadge status={statuses[v.id].status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
