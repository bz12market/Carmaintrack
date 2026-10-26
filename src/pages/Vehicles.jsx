import { useState } from "react";
import { Search, Car } from "lucide-react";
import { useStore } from "../lib/store.js";
import { fmtKm, vehicleName } from "../lib/util.js";
import { Link, StatusBadge, VehiclePhoto, Plate, Empty, Button } from "../components/ui.jsx";

const FILTERS = [
  ["all", "Todos"],
  ["overdue", "Atrasados"],
  ["soon", "A vencer"],
  ["ok", "Em dia"],
  ["none", "Sem revisão"],
];

export default function Vehicles() {
  const { data, statuses, clientOf, openRecord } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const needle = q.trim().toLowerCase().replace(/-/g, "");
  const list = data.vehicles
    .filter((v) => filter === "all" || statuses[v.id].status === filter)
    .filter(
      (v) =>
        !needle ||
        [v.plate.replace(/-/g, ""), v.make, v.model, clientOf(v)?.name, clientOf(v)?.phone]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(needle))
    )
    .sort((a, b) => a.plate.localeCompare(b.plate));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" size={18} />
          <input className="input pl-10" placeholder="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                filter === k ? "bg-brand text-white" : "bg-white/5 text-slate-400"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {data.vehicles.length === 0 ? (
        <Empty icon={Car} title="Ainda não há veículos">
          <Button className="mt-3" onClick={() => openRecord()}>
            Novo registo
          </Button>
        </Empty>
      ) : list.length === 0 ? (
        <Empty icon={Search} title="Nenhum resultado" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((v) => {
            const st = statuses[v.id];
            const c = clientOf(v);
            return (
              <Link key={v.id} to={`/veiculos/${v.id}`} className="card overflow-hidden transition hover:border-brand/40">
                <div className="relative">
                  <VehiclePhoto vehicle={v} className="h-28 w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <Plate className="absolute bottom-2 left-3 text-xl text-white">{v.plate}</Plate>
                  <StatusBadge status={st.status} className="absolute top-2 right-2 !bg-black/60" />
                </div>
                <div className="space-y-1 p-3 text-sm">
                  <p className="truncate font-medium text-white">{vehicleName(v) || "—"}</p>
                  <p className="truncate text-slate-400">{c?.name || "Sem proprietário"}</p>
                  <p className="flex justify-between text-xs text-slate-500">
                    <span>{fmtKm(v.current_km)}</span>
                    <span>
                      {st.count} serviço{st.count === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
