import { createClient } from "@supabase/supabase-js";
import { demoSeed } from "./demoSeed.js";

// O URL tem de ser só a origem do projeto (https://xxxx.supabase.co). Se for
// colado com um caminho (p.ex. ".../rest/v1/"), o Supabase responde
// "Invalid path specified in request URL", por isso fica só a origem.
function projectUrl(raw) {
  const value = (raw || "").trim();
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

const url = projectUrl(import.meta.env.VITE_SUPABASE_URL);
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Link de recuperação da palavra-passe: o Supabase limpa o URL ao arrancar,
// por isso isto é lido antes de criar o cliente.
export const recoveryFromUrl = typeof window !== "undefined" && /type=recovery/.test(window.location.hash);

/** Há um projeto Supabase configurado (produção). */
export const isConfigured = !!url && !!key;
export const supabase = isConfigured ? createClient(url, key) : null;

// Modo demonstração: dados de exemplo no localStorage deste browser, sem
// login. É usado em /demo e sempre que o Supabase não está configurado.
export let isDemo = !isConfigured;
export function setDemo(on) {
  isDemo = on || !isConfigured;
}

export const TABLES = ["clients", "vehicles", "services"];

const uuid = () =>
  crypto.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );

export const newToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");

// --- Modo demonstração ----------------------------------------------------

const DEMO_KEY = "carmaintrack-demo-v1";

function demoRead() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage indisponível: usa os dados de exemplo em memória */
  }
  const seed = demoSeed();
  demoWrite(seed);
  return seed;
}

function demoWrite(data) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  } catch {
    /* ignora: modo privado ou quota cheia */
  }
}

export function resetDemo() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignora */
  }
}

// --- Autenticação -----------------------------------------------------------

export async function getSession() {
  if (isDemo) return { user: { email: "demo@carmaintrack.app" } };
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb) {
  if (isDemo) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => cb(session, event));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// As contas são criadas pelo servidor depois do pagamento (api/register.js),
// por isso aqui não há registo, só recuperação da palavra-passe.
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/app`,
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Subscrição da conta com sessão iniciada (ou null). */
export async function getSubscription() {
  if (isDemo) return { status: "active", demo: true };
  const { data, error } = await supabase.from("subscriptions").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export const ACTIVE_STATUSES = ["active", "trialing", "past_due"];
export const isActive = (sub) => !!sub && ACTIVE_STATUSES.includes(sub.status);

/** Chama uma função do servidor (/api/...) com o token da sessão. */
export async function api(path, body) {
  const headers = { "content-type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  }
  const res = await fetch(`/api/${path}`, { method: "POST", headers, body: JSON.stringify(body || {}) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
  return json;
}

export async function signOut() {
  if (!isDemo) await supabase.auth.signOut();
}

// --- Dados da oficina -------------------------------------------------------

export async function loadAll() {
  if (isDemo) return demoRead();

  let { data: workshop, error } = await supabase.from("workshops").select("*").maybeSingle();
  if (error) throw error;
  if (!workshop) {
    const res = await supabase.from("workshops").insert({}).select().single();
    if (res.error) throw res.error;
    workshop = res.data;
  }

  const results = await Promise.all(
    TABLES.map((t) => supabase.from(t).select("*").order("created_at", { ascending: true }))
  );
  const out = { workshop };
  results.forEach((r, i) => {
    if (r.error) throw r.error;
    out[TABLES[i]] = r.data;
  });
  return out;
}

/** Insere ou atualiza uma linha e devolve-a tal como ficou guardada. */
export async function saveRow(table, row) {
  if (isDemo) {
    const data = demoRead();
    if (table === "workshops") {
      data.workshop = { ...data.workshop, ...row };
      demoWrite(data);
      return data.workshop;
    }
    const list = data[table];
    const saved = { created_at: new Date().toISOString(), ...row, id: row.id || uuid() };
    if (table === "vehicles" && !saved.public_token) saved.public_token = newToken();
    const i = list.findIndex((r) => r.id === saved.id);
    if (i >= 0) list[i] = saved;
    else list.push(saved);
    demoWrite(data);
    return saved;
  }

  const query = row.id
    ? supabase.from(table).update(row).eq("id", row.id)
    : supabase.from(table).insert(row);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function removeRow(table, id) {
  if (isDemo) {
    const data = demoRead();
    data[table] = data[table].filter((r) => r.id !== id);
    if (table === "vehicles") data.services = data.services.filter((s) => s.vehicle_id !== id);
    if (table === "clients")
      data.vehicles = data.vehicles.map((v) => (v.client_id === id ? { ...v, client_id: null } : v));
    demoWrite(data);
    return;
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// --- Portal público ---------------------------------------------------------

export async function getPublicVehicle(token) {
  if (isDemo) {
    const data = demoRead();
    const v = data.vehicles.find((x) => x.public_token === token);
    if (!v) return null;
    const owner = data.clients.find((c) => c.id === v.client_id);
    const services = data.services
      .filter((s) => s.vehicle_id === v.id)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return { vehicle: v, owner_name: owner?.name, workshop: data.workshop, services };
  }
  const { data, error } = await supabase.rpc("public_vehicle", { p_token: token });
  if (error) throw error;
  return data;
}
