import { useEffect, useState } from "react";
import {
  Loader2,
  Droplet,
  Filter,
  CalendarClock,
  History as HistoryIcon,
  AlertTriangle,
  Zap,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { getPublicVehicle } from "../lib/db.js";
import { applyTheme, normalizeTheme } from "../lib/theme.js";
import { STATUS, fmtDate, fmtKm, vehicleName, vehicleStatus, waLink } from "../lib/util.js";
import { Plate, VehiclePhoto } from "../components/ui.jsx";
import { Logo } from "../components/Layout.jsx";
import History from "../components/History.jsx";

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15">
        <Icon size={22} className="text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-widest text-subtle uppercase">{label}</p>
        <p className="font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function Portal({ token }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    getPublicVehicle(token)
      .then((data) => setState({ data }))
      .catch((e) => setState({ error: e.message || String(e) }));
  }, [token]);

  useEffect(() => {
    const w = state.data?.workshop;
    if (w) applyTheme(normalizeTheme(w.theme, w.primary_color));
    if (state.data) document.title = `${state.data.vehicle.plate} · ${state.data.workshop.name}`;
  }, [state.data]);

  if (state.loading)
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="animate-spin text-subtle" size={32} />
      </div>
    );

  if (!state.data)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-bold text-ink">Histórico não encontrado</p>
        <p className="mt-1 text-sm text-muted">
          {state.error ? "Não foi possível carregar o histórico. Tente novamente." : "O link pode estar incorreto ou ter sido desativado."}
        </p>
      </div>
    );

  const { vehicle, workshop: w, owner_name, services } = state.data;
  // A função pública não devolve ids internos; liga os serviços a este veículo para calcular o estado.
  const v = { ...vehicle, id: "self" };
  const st = vehicleStatus(v, services.map((s) => ({ ...s, vehicle_id: "self" })), w);
  const contact = w.whatsapp || w.phone;
  const name = vehicleName(vehicle);

  const bookingText = `Olá! Gostaria de marcar a revisão do ${name} (${vehicle.plate}).`;

  const nextLine = [
    st.nextKm != null &&
      `Aos ${fmtKm(st.nextKm)}${st.kmLeft != null ? ` (${st.kmLeft >= 0 ? `~${fmtKm(st.kmLeft)} restantes` : `passou ${fmtKm(-st.kmLeft)}`})` : ""}`,
  ].filter(Boolean)[0];
  const dateLine = st.nextDate
    ? st.daysLeft >= 0
      ? `Data prevista: ${fmtDate(st.nextDate)} (faltam ${st.daysLeft} dias)`
      : `Venceu a ${fmtDate(st.nextDate)}`
    : null;

  const StatusIcon = st.status === "ok" ? CheckCircle2 : st.status === "soon" ? Clock : AlertTriangle;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-gradient-to-b from-bg via-bg to-brand/10 pb-32">
      <header className="flex items-center gap-3 px-4 py-3">
        <Logo workshop={w} size={40} />
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{w.name}</p>
          <p className="truncate text-xs text-muted">{w.tagline || "Histórico de revisões"}</p>
        </div>
      </header>

      <section className="relative">
        <VehiclePhoto vehicle={vehicle} className="h-64 w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <Plate className="text-4xl text-ink drop-shadow-lg">{vehicle.plate}</Plate>
          <p className="text-ink-2">{name}</p>
        </div>
      </section>

      <div className="space-y-3 px-4">
        <section className="card divide-y divide-line px-4">
          {owner_name && <p className="py-3 text-ink-2">Proprietário: {owner_name}</p>}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted">Quilometragem atual</span>
            <span className="text-xl font-bold text-ink">{fmtKm(vehicle.current_km).replace(" km", "")}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted">Revisões</span>
            <span className="text-xl font-bold text-brand">{st.count}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted">Estado</span>
            <span className="flex items-center gap-1.5 text-xl font-bold" style={{ color: STATUS[st.status].color }}>
              <StatusIcon size={20} /> {STATUS[st.status].label}
            </span>
          </div>
        </section>

        {st.last?.oil && <Tile icon={Droplet} label="Óleo utilizado" value={st.last.oil} />}
        {st.last?.filters?.length > 0 && <Tile icon={Filter} label="Filtros" value={st.last.filters.join(", ")} />}
        {(st.nextKm != null || st.nextDate) && (
          <Tile
            icon={CalendarClock}
            label="Próxima revisão"
            value={[st.nextKm != null && fmtKm(st.nextKm), st.nextDate && fmtDate(st.nextDate)].filter(Boolean).join(" · ")}
          />
        )}
        <Tile icon={HistoryIcon} label="Histórico" value={`${st.count} registo${st.count === 1 ? "" : "s"}`} />

        {(st.status === "overdue" || st.status === "soon") && (
          <section
            className="rounded-2xl border p-4"
            style={{
              borderColor: `rgb(${STATUS[st.status].rgb} / 35%)`,
              background: `rgb(${STATUS[st.status].rgb} / 8%)`,
            }}
          >
            <div className="flex gap-3">
              <AlertTriangle size={28} className="shrink-0" style={{ color: STATUS[st.status].color }} />
              <div>
                <p className="text-lg font-bold text-ink">
                  {st.status === "overdue" ? "A sua revisão está atrasada" : "A sua revisão está a chegar"}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {st.status === "overdue"
                    ? "Recomendamos marcar a revisão o quanto antes para ajudar a proteger o motor."
                    : "Marque já a próxima visita e evite esquecimentos."}
                </p>
                {contact && (
                  <a
                    href={waLink(contact, bookingText)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <MessageCircle size={18} /> Pedir marcação
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {(nextLine || dateLine) && (
          <section className="flex gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
            <Zap size={22} className="shrink-0 text-brand" />
            <div>
              <p className="text-sm text-muted">Próxima revisão recomendada</p>
              {nextLine && <p className="font-bold text-brand">{nextLine}</p>}
              {dateLine && <p className="text-sm text-ink-2">{dateLine}</p>}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section className="pt-4">
            <h2 className="mb-3 text-xs font-bold tracking-widest text-subtle uppercase">Histórico de revisões</h2>
            <History services={st.services} />
          </section>
        )}

        <footer className="space-y-1 pt-6 text-center text-xs text-subtle">
          <p className="font-semibold text-muted">{w.name}</p>
          {w.address && (
            <p className="flex items-center justify-center gap-1">
              <MapPin size={12} /> {w.address}
            </p>
          )}
          {w.phone && <p>{w.phone}</p>}
        </footer>
      </div>

      {contact && (
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-lg gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a
            href={waLink(w.whatsapp || w.phone, `Olá! Sou cliente com o ${vehicle.plate}.`)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25d366] py-4 font-semibold text-white shadow-xl"
          >
            <MessageCircle size={20} /> Enviar mensagem
          </a>
          {w.phone && (
            <a
              href={`tel:${w.phone.replace(/\s/g, "")}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-semibold text-on-brand shadow-xl"
            >
              <Phone size={20} /> Ligar
            </a>
          )}
        </div>
      )}
    </div>
  );
}
