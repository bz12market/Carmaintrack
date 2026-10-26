import { useState } from "react";
import { Car, CheckCircle2, Clock, AlertTriangle, Users, Bell, QrCode, Search, AlertCircle, MessageCircleOff } from "lucide-react";
import { useStore } from "../lib/store.js";
import { fmtDate, fmtKm, vehicleName } from "../lib/util.js";
import { Link, StatusBadge, VehiclePhoto, Plate, Button } from "../components/ui.jsx";

function Stat({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
        <Icon size={20} style={{ color }} />
      </div>
      <p className="mt-2 text-4xl font-black" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data, statuses, clientOf, openRecord, openService } = useStore();
  const [q, setQ] = useState("");
  const all = Object.values(statuses);
  const count = (k) => all.filter((s) => s.status === k).length;
  const noPhone = data.vehicles.filter(
    (v) => v.reminders_enabled !== false && !clientOf(v)?.phone && ["soon", "overdue"].includes(statuses[v.id].status)
  ).length;

  const needle = q.trim().toLowerCase().replace(/-/g, "");
  const results = needle
    ? data.vehicles.filter((v) =>
        [v.plate.replace(/-/g, ""), v.make, v.model, clientOf(v)?.name, clientOf(v)?.phone]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(needle))
      )
    : [];

  const recent = [...data.services]
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden border-brand/30 bg-gradient-to-br from-brand/20 via-brand/5 to-transparent p-6">
        <p className="text-xs font-bold tracking-widest text-brand uppercase">Operação da oficina</p>
        <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Tudo o que importa, num só ecrã.</h1>
        <p className="mt-1 text-sm text-slate-400">Entradas, revisões, datas de regresso e alertas.</p>
        <div className="relative mt-5">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" size={18} />
          <input
            className="input !py-3 pl-10"
            placeholder="Procurar matrícula, cliente ou modelo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {needle && (
          <div className="mt-2 space-y-1">
            {results.length === 0 && <p className="px-1 text-sm text-slate-400">Nenhum veículo encontrado.</p>}
            {results.slice(0, 8).map((v) => (
              <Link
                key={v.id}
                to={`/veiculos/${v.id}`}
                className="flex items-center gap-3 rounded-xl bg-black/30 px-3 py-2 hover:bg-black/50"
              >
                <Plate className="text-white">{v.plate}</Plate>
                <span className="flex-1 truncate text-sm text-slate-400">
                  {vehicleName(v)} · {clientOf(v)?.name || "sem proprietário"}
                </span>
                <StatusBadge status={statuses[v.id].status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Veículos" value={data.vehicles.length} sub="registados" icon={Car} color="var(--brand)" />
        <Stat label="Em dia" value={count("ok")} sub="sem pendências" icon={CheckCircle2} color="#22c55e" />
        <Stat
          label="A vencer"
          value={count("soon")}
          sub={`menos de ${data.workshop.warn_km.toLocaleString("pt-PT")} km ou ${data.workshop.warn_days} dias`}
          icon={Clock}
          color="#eab308"
        />
        <Stat label="Atrasados" value={count("overdue")} sub="precisam de atenção" icon={AlertTriangle} color="#ef4444" />
      </section>

      <section className="space-y-2">
        {count("overdue") > 0 && (
          <Link
            to="/lembretes"
            className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            <AlertCircle size={18} /> {count("overdue")} veículo(s) passaram a quilometragem ou a data da revisão.
            <span className="ml-auto underline">Ver lembretes →</span>
          </Link>
        )}
        {count("soon") > 0 && (
          <Link
            to="/lembretes"
            className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
          >
            <Clock size={18} /> {count("soon")} veículo(s) dentro do prazo de aviso.
            <span className="ml-auto underline">Ver →</span>
          </Link>
        )}
        {noPhone > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
            <MessageCircleOff size={18} /> {noPhone} veículo(s) a precisar de lembrete, mas sem número de WhatsApp registado.
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["/veiculos", "Clientes e veículos", Users],
          ["/lembretes", "Lembretes", Bell],
          ["/cartoes", "Cartões e QR", QrCode],
        ].map(([to, label, Icon]) => (
          <Link key={to} to={to} className="card flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:border-brand/40">
            <Icon size={18} className="text-brand" /> {label}
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">Últimos serviços</h2>
        {recent.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-semibold text-white">Ainda não há serviços registados.</p>
            <p className="text-sm text-slate-400">Comece por registar um cliente e o respetivo veículo.</p>
            <div className="flex gap-2">
              <Button onClick={() => openRecord()}>Novo registo</Button>
              {data.vehicles.length > 0 && (
                <Button variant="ghost" onClick={() => openService()}>
                  Registar revisão
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="card divide-y divide-white/5">
            {recent.map((s) => {
              const v = data.vehicles.find((x) => x.id === s.vehicle_id);
              if (!v) return null;
              return (
                <Link key={s.id} to={`/veiculos/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
                  <VehiclePhoto vehicle={v} className="h-10 w-14 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <Plate className="text-white">{v.plate}</Plate>
                      <span className="text-slate-400"> · {s.title}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {fmtDate(s.date)} · {fmtKm(s.km)} {s.oil ? `· ${s.oil}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={statuses[v.id].status} className="hidden sm:inline-flex" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
