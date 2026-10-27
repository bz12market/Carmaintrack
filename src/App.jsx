import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import * as db from "./lib/db.js";
import { go, setArea, usePath } from "./lib/router.js";
import { StoreContext } from "./lib/store.js";
import { vehicleStatus } from "./lib/util.js";
import { applyTheme, normalizeTheme } from "./lib/theme.js";
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
import Landing from "./pages/Landing.jsx";
import Register from "./pages/Register.jsx";
import { SetPassword, SubscriptionRequired } from "./pages/Account.jsx";

const PORTAL = /^\/v\/([A-Za-z0-9]+)\/?$/;

// Zonas da app:
//   /              landing page (pública)
//   /entrar        login            /registo   criar conta depois do pagamento
//   /app/...       painel da oficina (login + subscrição ativa)
//   /demo/...      demonstração com dados de exemplo, sem login
//   /v/<código>    portal público do cliente (e /demo/v/<código> na demo)
// Zona onde a app estava no render anterior (null no primeiro carregamento).
let lastZone = null;

/** Entrar no painel da demo a partir de outra zona é uma visita nova. */
function trackDemoVisit(zone) {
  if (zone === lastZone) return;
  if (zone === "demo") db.startDemoVisit({ firstLoad: lastZone === null });
  else if (lastZone === "demo") db.endDemoVisit();
  lastZone = zone;
}

export default function App() {
  const url = usePath();
  const path = url.split("?")[0];

  if (path === "/demo" || path.startsWith("/demo/")) {
    db.setDemo(true);
    setArea("/demo", "/demo");
    const inner = path.slice("/demo".length) || "/";
    const portal = inner.match(PORTAL);
    // O portal da demo abre noutro separador e mostra os dados da visita em curso.
    if (portal) return <Portal token={portal[1]} />;
    trackDemoVisit("demo");
    return <AdminApp key="demo" path={inner} url={url} />;
  }

  trackDemoVisit("other");
  db.setDemo(false);
  if (path === "/app" || path.startsWith("/app/")) {
    setArea("/app", "");
    return <AdminApp key="app" path={path.slice("/app".length) || "/"} url={url} />;
  }

  setArea("", "");
  const portal = path.match(PORTAL);
  if (portal) return <Portal token={portal[1]} />;
  if (path === "/entrar") return <Login />;
  if (path === "/registo") return <Register />;
  return <Landing />;
}

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="animate-spin text-subtle" size={32} />
    </div>
  );
}

function AdminApp({ path, url }) {
  const [session, setSession] = useState(undefined);
  const [recovery, setRecovery] = useState(db.recoveryFromUrl);
  const [subscription, setSubscription] = useState(undefined);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { type: "record" | "service", ... }

  useEffect(() => {
    db.getSession().then(setSession);
    return db.onAuthChange((s, event) => {
      setSession(s);
      // Link "esqueci-me da palavra-passe" do email: pede a nova palavra-passe.
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const sub = await db.getSubscription();
      setSubscription(sub);
      // Sem subscrição ativa a base de dados recusa o acesso (RLS).
      if (db.isActive(sub)) setData(await db.loadAll());
      setError("");
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  // Só recarrega quando muda a conta, não a cada renovação do token.
  // Na demo, os dados apagam-se 48 h depois de criados, mesmo com a página aberta.
  useEffect(() => {
    if (!db.isDemo) return;
    const timer = setInterval(() => {
      if (db.demoIsExpired()) refresh();
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [refresh]);

  const userId = session?.user?.id || (session ? "demo" : null);
  useEffect(() => {
    if (userId) refresh();
    else {
      setData(null);
      setSubscription(undefined);
    }
  }, [userId, refresh]);

  useEffect(() => {
    if (data?.workshop) applyTheme(normalizeTheme(data.workshop.theme, data.workshop.primary_color));
  }, [data?.workshop?.theme, data?.workshop?.primary_color]); // eslint-disable-line react-hooks/exhaustive-deps

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
      subscription,
      save,
      remove,
      refresh,
      clientOf: (v) => data?.clients.find((c) => c.id === v?.client_id),
      openRecord: (vehicle) => setModal({ type: "record", vehicle }),
      openService: (vehicleId, service) => setModal({ type: "service", vehicleId, service }),
    }),
    [data, statuses, subscription, save, remove, refresh]
  );

  if (session === undefined) return <Spinner />;
  if (!session) return <Login />;
  if (recovery) return <SetPassword onDone={() => setRecovery(false)} />;
  if (error)
    return (
      <div className="mx-auto max-w-md p-6 pt-24 text-center">
        <p className="font-semibold text-danger">Não foi possível carregar os dados.</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <p className="mt-2 text-sm text-subtle">Confirma que correste o supabase/schema.sql no teu projeto.</p>
        <button className="mt-6 mr-4 text-sm text-muted underline" onClick={() => db.signOut().then(() => go("/entrar"))}>
          Sair
        </button>
        <button className="mt-6 text-sm text-brand underline" onClick={refresh}>
          Tentar de novo
        </button>
      </div>
    );
  if (subscription === undefined) return <Spinner />;
  if (!db.isActive(subscription))
    return <SubscriptionRequired subscription={subscription} email={session.user?.email} onRefresh={refresh} />;
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
