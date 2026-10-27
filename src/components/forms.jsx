import { useMemo, useState } from "react";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { useStore } from "../lib/store.js";
import { navigate } from "../lib/router.js";
import {
  FILTERS,
  SERVICE_TITLES,
  addMonths,
  normalizePlate,
  resizeImage,
  todayISO,
  vehicleName,
} from "../lib/util.js";
import { Button, Field, Modal, VehiclePhoto } from "./ui.jsx";

const toInt = (v) => (v === "" || v == null ? null : parseInt(String(v).replace(/\D/g, ""), 10));

/** Novo registo (cliente + veículo) ou edição de um veículo existente. */
export function RecordForm({ vehicle, onClose }) {
  const { data, save, clientOf } = useStore();
  const editing = !!vehicle;
  const existingClient = editing ? clientOf(vehicle) : null;

  const [clientMode, setClientMode] = useState(editing ? "existing" : "new");
  const [clientId, setClientId] = useState(existingClient?.id || "");
  const [client, setClient] = useState({ name: "", phone: "", email: "" });
  const [v, setV] = useState(
    vehicle || { plate: "", make: "", model: "", year: "", current_km: "", photo_url: "", reminders_enabled: true }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setField = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const plate = normalizePlate(v.plate);
    if (!plate) return setErr("Indica a matrícula.");
    const dup = data.vehicles.find((x) => normalizePlate(x.plate) === plate && x.id !== vehicle?.id);
    if (dup) return setErr(`Já existe um veículo com a matrícula ${plate}.`);
    if (clientMode === "new" && !client.name.trim()) return setErr("Indica o nome do cliente.");

    setBusy(true);
    try {
      let cid = clientMode === "existing" ? clientId || null : null;
      if (clientMode === "new") cid = (await save("clients", { ...client, name: client.name.trim() })).id;
      const saved = await save("vehicles", {
        ...v,
        plate,
        client_id: cid,
        year: toInt(v.year),
        current_km: toInt(v.current_km) ?? 0,
      });
      onClose();
      if (!editing) navigate(`/veiculos/${saved.id}`);
    } catch (e2) {
      setErr(e2.message || String(e2));
      setBusy(false);
    }
  }

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await resizeImage(file, 900);
    setV((x) => ({ ...x, photo_url: url }));
  }

  return (
    <Modal title={editing ? "Editar veículo" : "Novo registo"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-white">Cliente</h3>
          {data.clients.length > 0 && (
            <div className="flex gap-2">
              {[
                ["new", "Novo cliente"],
                ["existing", "Cliente existente"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setClientMode(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    clientMode === k ? "bg-brand text-white" : "bg-white/5 text-slate-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          {clientMode === "existing" ? (
            <Field label="Proprietário">
              <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— Sem proprietário —</option>
                {[...data.clients]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `· ${c.phone}` : ""}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome" className="sm:col-span-2">
                <input
                  className="input"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  placeholder="Ex.: Inês Martins"
                />
              </Field>
              <Field label="Telemóvel / WhatsApp">
                <input
                  className="input"
                  inputMode="tel"
                  value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  placeholder="912 345 678"
                />
              </Field>
              <Field label="Email (opcional)">
                <input
                  className="input"
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                />
              </Field>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-white">Veículo</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Matrícula">
              <input
                className="input font-plate tracking-widest uppercase"
                value={v.plate}
                onChange={setField("plate")}
                placeholder="AA-00-BB"
                autoFocus={!editing}
              />
            </Field>
            <Field label="Quilometragem atual">
              <input className="input" inputMode="numeric" value={v.current_km ?? ""} onChange={setField("current_km")} />
            </Field>
            <Field label="Marca">
              <input className="input" value={v.make || ""} onChange={setField("make")} placeholder="Renault" />
            </Field>
            <Field label="Modelo / motor">
              <input className="input" value={v.model || ""} onChange={setField("model")} placeholder="Captur 1.3 TCe" />
            </Field>
            <Field label="Ano">
              <input className="input" inputMode="numeric" value={v.year ?? ""} onChange={setField("year")} />
            </Field>
            <Field label="Fotografia (opcional)">
              <label className="input flex cursor-pointer items-center gap-3">
                <VehiclePhoto vehicle={v} className="h-8 w-12 rounded-md" />
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ImagePlus size={16} /> {v.photo_url ? "Trocar" : "Escolher"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
              </label>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={v.reminders_enabled !== false}
              onChange={(e) => setV({ ...v, reminders_enabled: e.target.checked })}
              className="accent-[var(--brand)]"
            />
            Incluir nos lembretes de revisão
          </label>
        </section>

        {err && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {editing ? "Guardar" : "Criar registo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Registo (ou edição) de um serviço/revisão. */
export function ServiceForm({ vehicleId, service, onClose }) {
  const { data, save, clientOf } = useStore();
  const w = data.workshop;
  const [vid, setVid] = useState(service?.vehicle_id || vehicleId || "");
  const vehicle = data.vehicles.find((x) => x.id === vid);

  const initial = () => {
    if (service) return { ...service, extras: service.extras || [], filters: service.filters || [] };
    const km = vehicle?.current_km || "";
    const date = todayISO();
    return {
      title: "Mudança de óleo",
      date,
      km,
      oil: "",
      filters: ["Óleo"],
      extras: [],
      notes: "",
      next_km: km ? Number(km) + w.default_interval_km : "",
      next_date: addMonths(date, w.default_interval_months),
    };
  };
  const [s, setS] = useState(initial);
  const [autoNext, setAutoNext] = useState(!service);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Óleos já usados, para sugerir no campo.
  const oils = useMemo(() => [...new Set(data.services.map((x) => x.oil).filter(Boolean))], [data.services]);

  function update(patch) {
    setS((prev) => {
      const next = { ...prev, ...patch };
      if (autoNext) {
        if ("km" in patch) next.next_km = toInt(patch.km) != null ? toInt(patch.km) + w.default_interval_km : "";
        if ("date" in patch && patch.date) next.next_date = addMonths(patch.date, w.default_interval_months);
      }
      return next;
    });
  }

  function chooseVehicle(id) {
    setVid(id);
    const km = data.vehicles.find((x) => x.id === id)?.current_km || "";
    update({ km });
  }

  const toggleFilter = (f) =>
    setS((x) => ({ ...x, filters: x.filters.includes(f) ? x.filters.filter((y) => y !== f) : [...x.filters, f] }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!vehicle) return setErr("Escolhe o veículo.");
    setBusy(true);
    try {
      const km = toInt(s.km);
      await save("services", {
        ...s,
        vehicle_id: vehicle.id,
        km,
        next_km: toInt(s.next_km),
        next_date: s.next_date || null,
        extras: s.extras.filter((x) => x.name.trim()),
      });
      if (km != null && km > (vehicle.current_km || 0)) await save("vehicles", { ...vehicle, current_km: km });
      onClose();
      navigate(`/veiculos/${vehicle.id}${service ? "" : "?etiqueta=1"}`);
    } catch (e2) {
      setErr(e2.message || String(e2));
      setBusy(false);
    }
  }

  return (
    <Modal title={service ? "Editar serviço" : "Registar revisão"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        {!vehicleId && !service ? (
          <Field label="Veículo">
            <select className="input" value={vid} onChange={(e) => chooseVehicle(e.target.value)} autoFocus>
              <option value="">— Escolher —</option>
              {[...data.vehicles]
                .sort((a, b) => a.plate.localeCompare(b.plate))
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.plate} · {vehicleName(x)} {clientOf(x) ? `· ${clientOf(x).name}` : ""}
                  </option>
                ))}
            </select>
            {data.vehicles.length === 0 && (
              <p className="mt-2 text-xs text-slate-400">Ainda não há veículos. Cria primeiro um "Novo registo".</p>
            )}
          </Field>
        ) : (
          vehicle && (
            <p className="text-sm text-slate-400">
              <span className="font-plate font-bold text-white">{vehicle.plate}</span> · {vehicleName(vehicle)}
            </p>
          )
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tipo de serviço">
            <select className="input" value={s.title} onChange={(e) => update({ title: e.target.value })}>
              {[...new Set([...SERVICE_TITLES, s.title])].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Data">
            <input type="date" className="input" value={s.date} onChange={(e) => update({ date: e.target.value })} required />
          </Field>
          <Field label="Quilometragem">
            <input className="input" inputMode="numeric" value={s.km ?? ""} onChange={(e) => update({ km: e.target.value })} />
          </Field>
        </div>

        <Field label="Óleo utilizado">
          <input
            className="input"
            list="oils"
            value={s.oil || ""}
            onChange={(e) => update({ oil: e.target.value })}
            placeholder="Ex.: Castrol Edge 5W-30 LL"
          />
          <datalist id="oils">
            {oils.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Field>

        <div>
          <span className="label">Filtros substituídos</span>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  s.filters.includes(f)
                    ? "border-brand bg-brand/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Serviços adicionais / peças</span>
          <div className="space-y-2">
            {s.extras.map((x, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  placeholder="Ex.: Pastilhas de travão"
                  value={x.name}
                  onChange={(e) =>
                    setS({ ...s, extras: s.extras.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) })
                  }
                />
                <input
                  className="input"
                  placeholder="Nota (opcional)"
                  value={x.note || ""}
                  onChange={(e) =>
                    setS({ ...s, extras: s.extras.map((y, j) => (j === i ? { ...y, note: e.target.value } : y)) })
                  }
                />
                <button
                  type="button"
                  className="rounded-xl px-2 text-slate-500 hover:text-red-300"
                  onClick={() => setS({ ...s, extras: s.extras.filter((_, j) => j !== i) })}
                  aria-label="Remover"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-medium text-brand"
              onClick={() => setS({ ...s, extras: [...s.extras, { name: "", note: "" }] })}
            >
              <Plus size={16} /> Adicionar
            </button>
          </div>
        </div>

        <Field label="Observações (visíveis para o cliente)">
          <textarea className="input min-h-20" value={s.notes || ""} onChange={(e) => update({ notes: e.target.value })} />
        </Field>

        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Próxima revisão</h3>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
                className="accent-[var(--brand)]"
              />
              Calcular automaticamente (+{w.default_interval_km.toLocaleString("pt-PT")} km / {w.default_interval_months}{" "}
              meses)
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Aos (km)">
              <input
                className="input"
                inputMode="numeric"
                value={s.next_km ?? ""}
                onChange={(e) => {
                  setAutoNext(false);
                  setS({ ...s, next_km: e.target.value });
                }}
              />
            </Field>
            <Field label="Até (data)">
              <input
                type="date"
                className="input"
                value={s.next_date || ""}
                onChange={(e) => {
                  setAutoNext(false);
                  setS({ ...s, next_date: e.target.value });
                }}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-slate-500">Vence pelo que chegar primeiro. Deixa um dos campos vazio para usar só o outro.</p>
        </div>

        {err && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            Guardar serviço
          </Button>
        </div>
      </form>
    </Modal>
  );
}
