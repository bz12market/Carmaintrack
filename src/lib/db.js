import { createClient } from "@supabase/supabase-js";
import { demoSeed } from "./demoSeed.js";

// Sem as variáveis do Supabase a app corre em "modo demonstração": os dados
// ficam guardados no localStorage deste browser, sem login.
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

export const isDemo = !url || !key;
export const supabase = isDemo ? null : createClient(url, key);

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
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
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
