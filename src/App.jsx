import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import * as db from "./lib/db.js";
import { usePath } from "./lib/router.js";
import { StoreContext } from "./lib/store.js";
import { vehicleStatus } from "./lib/util.js";
import Layout from "./components/Layout.jsx";
import { RecordForm, ServiceForm } from "./components/forms.jsx";
import Login from "./pages/Login.jsx";
import Portal from "./pages/Portal.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import Reminders from "./pages/Reminders.jsx";
import Cards from "./pages/Cards.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  const url = usePath();
  const path = url.split("?")[0];
  const portal = path.match(/^\/v\/([A-Za-z0-9]+)\/?$/);
  if (portal) return <Portal token={portal[1]} />;
  return <AdminApp path={path} url={url} />;
}

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="animate-spin text-slate-500" size={32} />
    </div>
  );
}

function AdminApp({ path, url }) {
  const [session, setSession] = useState(undefined);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { type: "record" | "service", ... }

  useEffect(() => {
    db.getSession().then(setSession);
    return db.onAuthChange(setSession);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setData(await db.loadAll());
      setError("");
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    if (session) refresh();
    else setData(null);
  }, [session, refresh]);

  useEffect(() => {
    if (data?.workshop?.primary_color)
      document.documentElement.style.setProperty("--brand", data.workshop.primary_color);
  }, [data?.workshop?.primary_color]);

  const save = useCallback(async (table, row) => {
    const saved = await db.saveRow(table, row);
    setData((d) => {
      if (table === "workshops") return { ...d, workshop: saved };
      const list = d[table];
      const exists = list.some((r) => r.id === saved.id);
      return { ...d, [table]: exists ? list.map((r) => (r.id === saved.id ? saved : r)) : [...list, saved] };
    });
    return saved;
  }, []);

  const remove = useCallback(async (table, id) => {
    await db.removeRow(table, id);
    setData((d) => {
      const next = { ...d, [table]: d[table].filter((r) => r.id !== id) };
      if (table === "vehicles") next.services = d.services.filter((s) => s.vehicle_id !== id);
      if (table === "clients")
        next.vehicles = d.vehicles.map((v) => (v.client_id === id ? { ...v, client_id: null } : v));
      return next;
    });
  }, []);

  // Estado de cada veículo, calculado uma vez por alteração dos dados.
  const statuses = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.vehicles.map((v) => [v.id, vehicleStatus(v, data.services, data.workshop)]));
  }, [data]);

  const store = useMemo(
    () => ({
      data,
      statuses,
      save,
      remove,
      refresh,
      clientOf: (v) => data?.clients.find((c) => c.id === v?.client_id),
      openRecord: (vehicle) => setModal({ type: "record", vehicle }),
      openService: (vehicleId, service) => setModal({ type: "service", vehicleId, service }),
    }),
    [data, statuses, save, remove, refresh]
  );

  if (session === undefined) return <Spinner />;
  if (!session) return <Login />;
  if (error)
    return (
      <div className="mx-auto max-w-md p-6 pt-24 text-center">
        <p className="font-semibold text-red-300">Não foi possível carregar os dados.</p>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <p className="mt-2 text-sm text-slate-500">Confirma que correste o supabase/schema.sql no teu projeto.</p>
        <button className="mt-6 text-sm text-brand underline" onClick={refresh}>
          Tentar de novo
        </button>
      </div>
    );
  if (!data) return <Spinner />;

  const vehicleMatch = path.match(/^\/veiculos\/([^/]+)$/);
  let page;
  if (vehicleMatch) page = <VehicleDetail key={url} id={vehicleMatch[1]} />;
  else if (path === "/veiculos") page = <Vehicles />;
  else if (path === "/lembretes") page = <Reminders />;
  else if (path === "/cartoes") page = <Cards key={url} />;
  else if (path === "/personalizar") page = <Settings />;
  else page = <Dashboard />;

  const close = () => setModal(null);

  return (
    <StoreContext.Provider value={store}>
      <Layout path={path} email={session.user?.email}>
        {page}
      </Layout>
      {modal?.type === "record" && <RecordForm vehicle={modal.vehicle} onClose={close} />}
      {modal?.type === "service" && (
        <ServiceForm vehicleId={modal.vehicleId} service={modal.service} onClose={close} />
      )}
    </StoreContext.Provider>
  );
}
