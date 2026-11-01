import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ImagePlus, Loader2, Search, CheckCircle2, Sparkles } from "lucide-react";
import { useStore } from "../lib/store.js";
import { DEMO_LIMITS, demoLimitMessage, isDemo, lookupPlate } from "../lib/db.js";
import { navigate } from "../lib/router.js";
import {
  FILTERS,
  filterNames,
  SERVICE_TITLES,
  addMonths,
  normalizePlate,
  resizeImage,
  todayISO,
  vehicleName,
} from "../lib/util.js";
import { Button, Field, Modal, VehiclePhoto } from "./ui.jsx";

const toInt = (v) => (v === "" || v == null ? null : parseInt(String(v).replace(/\D/g, ""), 10));

// Matrícula portuguesa completa: 6 letras/algarismos em 3 pares.
const isFullPlate = (p) => /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/.test(p);

/**
 * Novo registo (cliente + veículo) ou edição de um veículo existente.
 * `clientId` pré-escolhe o proprietário (p.ex. "Adicionar veículo" na ficha do cliente).
 */
export function RecordForm({ vehicle, clientId: presetClientId, onClose }) {
  const { data, save, clientOf } = useStore();
  const editing = !!vehicle;
  const existingClient = editing ? clientOf(vehicle) : null;

  const [clientMode, setClientMode] = useState(editing || presetClientId ? "existing" : "new");
  const [clientId, setClientId] = useState(existingClient?.id || presetClientId || "");
  const [client, setClient] = useState({ name: "", phone: "", email: "" });
  const [v, setV] = useState(
    vehicle || { plate: "", make: "", model: "", year: "", current_km: "", photo_url: "", reminders_enabled: true }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setField = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  // Identificação automática pela matrícula: preenche marca, modelo/motor e ano;
  // o utilizador só confirma (ou corrige, o que também conta como confirmação).
  const [lookup, setLookup] = useState({ status: "idle" }); // idle | loading | found | notfound | off | error
  const looked = useRef(editing ? normalizePlate(vehicle.plate) : "");

  async function identify() {
    const plate = normalizePlate(v.plate);
    if (!isFullPlate(plate)) return setLookup({ status: "error", message: "Escreva a matrícula completa (AA-00-AA)." });
    looked.current = plate;
    setLookup({ status: "loading" });
    try {
      const r = await lookupPlate(plate);
      if (looked.current !== plate) return; // entretanto foi pedida outra matrícula
      if (!r.found) return setLookup({ status: "notfound" });
      setV((x) => ({
        ...x,
        make: r.make || x.make,
        model: [r.model, r.engine].filter(Boolean).join(" ") || x.model,
        year: x.year || r.year || "",
      }));
      setLookup({ status: "found", data: r, confirmed: false });
    } catch (e) {
      setLookup(e.status === 501 ? { status: "off" } : { status: "error", message: e.message });
    }
  }

  // Num registo novo, identifica assim que a matrícula estiver completa.
  useEffect(() => {
    const plate = normalizePlate(v.plate);
    if (editing || !isFullPlate(plate) || plate === looked.current) return;
    const timer = setTimeout(identify, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.plate, editing]);

  // Corrigir a marca ou o modelo à mão conta como confirmação.
  const setIdentified = (k) => (e) => {
    setField(k)(e);
    if (lookup.status === "found") setLookup((l) => ({ ...l, confirmed: true }));
  };

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const plate = normalizePlate(v.plate);
    if (!plate) return setErr("Indica a matrícula.");
    const dup = data.vehicles.find((x) => normalizePlate(x.plate) === plate && x.id !== vehicle?.id);
    if (dup) return setErr(`Já existe um veículo com a matrícula ${plate}.`);
    if (clientMode === "new" && !client.name.trim()) return setErr("Indica o nome do cliente.");
    if (lookup.status === "found" && !lookup.confirmed)
      return setErr("Confirme se a marca e o modelo identificados pela matrícula estão corretos.");
    // Na demo, verifica os limites antes de gravar (para não ficar um cliente sem veículo).
    if (isDemo && !editing) {
      if (data.vehicles.length >= DEMO_LIMITS.vehicles) return setErr(demoLimitMessage("vehicles"));
      if (clientMode === "new" && data.clients.length >= DEMO_LIMITS.clients)
        return setErr(`${demoLimitMessage("clients")} Também pode escolher um cliente existente.`);
    }

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
          <h3 className="text-sm font-bold text-ink">Cliente</h3>
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
                    clientMode === k ? "bg-brand text-on-brand" : "bg-ink/5 text-ink-2"
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
          <h3 className="text-sm font-bold text-ink">Veículo</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Matrícula">
              <div className="flex gap-2">
                <input
                  className="input font-plate tracking-widest uppercase"
                  value={v.plate}
                  onChange={setField("plate")}
                  onBlur={() => setV((x) => ({ ...x, plate: normalizePlate(x.plate) }))}
                  placeholder="AA-00-BB"
                  autoFocus={!editing}
                />
                <button
                  type="button"
                  onClick={identify}
                  disabled={lookup.status === "loading"}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink-2 hover:bg-ink/5 disabled:opacity-50"
                  title="Identificar marca e modelo pela matrícula"
                >
                  {lookup.status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span className="hidden sm:inline">Identificar</span>
                </button>
              </div>
            </Field>
            <Field label="Quilometragem atual">
              <input className="input" inputMode="numeric" value={v.current_km ?? ""} onChange={setField("current_km")} />
            </Field>
            <Field label="Marca">
              <input
                className={`input ${lookup.status === "found" && !lookup.confirmed ? "!border-warn" : ""}`}
                value={v.make || ""}
                onChange={setIdentified("make")}
                placeholder="Renault"
              />
            </Field>
            <Field label="Modelo / motor">
              <input
                className={`input ${lookup.status === "found" && !lookup.confirmed ? "!border-warn" : ""}`}
                value={v.model || ""}
                onChange={setIdentified("model")}
                placeholder="Captur 1.3 TCe"
              />
            </Field>
            <Field label="Ano">
              <input className="input" inputMode="numeric" value={v.year ?? ""} onChange={setField("year")} />
            </Field>
            <Field label="Fotografia (opcional)">
              <label className="input flex cursor-pointer items-center gap-3">
                <VehiclePhoto vehicle={v} className="h-8 w-12 rounded-md" />
                <span className="flex items-center gap-1.5 text-ink-2">
                  <ImagePlus size={16} /> {v.photo_url ? "Trocar" : "Escolher"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
              </label>
            </Field>
          </div>
          <PlateLookupStatus
            lookup={lookup}
            vehicle={v}
            onConfirm={() => setLookup((l) => ({ ...l, confirmed: true }))}
          />
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={v.reminders_enabled !== false}
              onChange={(e) => setV({ ...v, reminders_enabled: e.target.checked })}
              className="accent-[var(--brand)]"
            />
            Incluir nos lembretes de revisão
          </label>
        </section>

        {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}

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

/** Novo cliente (sem `client`) ou edição dos dados de um cliente. */
export function ClientForm({ client, onClose }) {
  const { save } = useStore();
  const editing = !!client?.id;
  const [c, setC] = useState(client || { name: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setC({ ...c, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!c.name.trim()) return setErr("Indique o nome do cliente.");
    setBusy(true);
    try {
      const saved = await save("clients", { ...c, name: c.name.trim() });
      onClose();
      if (!editing) navigate(`/clientes/${saved.id}`);
    } catch (e2) {
      setErr(e2.message || String(e2));
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? "Editar cliente" : "Novo cliente"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome">
          <input className="input" value={c.name} onChange={set("name")} placeholder="Ex.: Inês Martins" autoFocus={!editing} />
        </Field>
        <Field label="Telemóvel / WhatsApp">
          <input className="input" inputMode="tel" value={c.phone || ""} onChange={set("phone")} placeholder="912 345 678" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={c.email || ""} onChange={set("email")} />
        </Field>
        <Field label="Notas internas">
          <textarea className="input" value={c.notes || ""} onChange={set("notes")} />
        </Field>
        {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {editing ? "Guardar" : "Criar cliente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Resultado da identificação pela matrícula, com o botão de confirmação. */
function PlateLookupStatus({ lookup, vehicle, onConfirm }) {
  if (lookup.status === "loading")
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> A identificar o veículo pela matrícula…
      </p>
    );
  if (lookup.status === "notfound")
    return <p className="text-sm text-muted">Não encontrámos esta matrícula. Preencha a marca e o modelo.</p>;
  if (lookup.status === "error") return <p className="text-sm text-danger">{lookup.message}</p>;
  if (lookup.status === "off")
    return <p className="text-xs text-subtle">A identificação automática pela matrícula não está ativa. Preencha a marca e o modelo.</p>;
  if (lookup.status !== "found") return null;
  const summary = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" · ");
  if (lookup.confirmed)
    return (
      <p className="flex items-center gap-2 text-sm text-ok">
        <CheckCircle2 size={16} /> Dados do veículo confirmados.
      </p>
    );
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2.5 text-sm">
      <Sparkles size={18} className="shrink-0 text-warn" />
      <p className="min-w-0 flex-1 text-ink">
        Identificámos <b>{summary}</b>. Confirme se está correto ou corrija a marca e o modelo.
        {lookup.data?.sample && <span className="block text-xs text-muted">Na demonstração, os dados são de exemplo.</span>}
      </p>
      <Button onClick={onConfirm} className="!py-2">
        <CheckCircle2 size={16} /> Está correto
      </Button>
    </div>
  );
}

/** Registo (ou edição) de um serviço/revisão. */
export function ServiceForm({ vehicleId, service, onClose }) {
  const { data, save, clientOf } = useStore();
  const w = data.workshop;
  const [vid, setVid] = useState(service?.vehicle_id || vehicleId || "");
  const vehicle = data.vehicles.find((x) => x.id === vid);

  const initial = () => {
    if (service) return { ...service, extras: service.extras || [], filters: filterNames(service.filters) };
    const km = vehicle?.current_km || "";
    const date = todayISO();
    return {
      title: "Mudança de óleo",
      date,
      km,
      oil: "",
      filters: ["Filtro de óleo"],
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
              <p className="mt-2 text-xs text-muted">Ainda não há veículos. Cria primeiro um "Novo registo".</p>
            )}
          </Field>
        ) : (
          vehicle && (
            <p className="text-sm text-muted">
              <span className="font-plate font-bold text-ink">{vehicle.plate}</span> · {vehicleName(vehicle)}
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
                    ? "border-brand bg-brand/20 text-ink"
                    : "border-line bg-ink/5 text-muted"
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
                  className="rounded-xl px-2 text-subtle hover:text-danger"
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
            <h3 className="text-sm font-bold text-ink">Próxima revisão</h3>
            <label className="flex items-center gap-2 text-xs text-muted">
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
          <p className="mt-2 text-xs text-subtle">Vence pelo que chegar primeiro. Deixa um dos campos vazio para usar só o outro.</p>
        </div>

        {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}

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
