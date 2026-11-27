import { useState } from "react";
import { Search, Users, UserPlus, Phone, Mail, Car } from "lucide-react";
import { useStore } from "../lib/store.js";
import { Link, Empty, Button } from "../components/ui.jsx";

export default function Clients() {
  const { data, openClient } = useStore();
  const [q, setQ] = useState("");

  const vehiclesOf = (c) => data.vehicles.filter((v) => v.client_id === c.id);
  const needle = q.trim().toLowerCase().replace(/-/g, "");
  const list = [...data.clients]
    .filter(
      (c) =>
        !needle ||
        [c.name, c.phone, c.email, ...vehiclesOf(c).map((v) => v.plate.replace(/-/g, ""))]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().replace(/\s/g, "").includes(needle.replace(/\s/g, "")))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-subtle" size={18} />
          <input
            className="input pl-10"
            placeholder="Pesquisar por nome, telefone, email ou matrícula"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button onClick={() => openClient()}>
          <UserPlus size={16} /> Novo cliente
        </Button>
      </div>

      {data.clients.length === 0 ? (
        <Empty icon={Users} title="Ainda não há clientes">
          <Button className="mt-3" onClick={() => openClient()}>
            Novo cliente
          </Button>
        </Empty>
      ) : list.length === 0 ? (
        <Empty icon={Search} title="Nenhum resultado" />
      ) : (
        <div className="card divide-y divide-line">
          {list.map((c) => {
            const vs = vehiclesOf(c);
            return (
              <Link key={c.id} to={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.03]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                  {c.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  <p className="flex flex-wrap gap-x-3 text-xs text-muted">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {c.email}
                      </span>
                    )}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
                  <Car size={15} /> {vs.length}
                  <span className="hidden font-plate text-xs sm:inline">{vs.map((v) => v.plate).slice(0, 2).join(", ")}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
