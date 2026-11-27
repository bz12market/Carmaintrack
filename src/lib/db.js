import { createClient } from "@supabase/supabase-js";
import { demoSeed } from "./demoSeed.js";
import { resizeImage } from "./util.js";

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

// Links dos emails do Supabase que pedem para definir a palavra-passe:
// "recovery" (esqueci-me) e "invite" (boas-vindas depois de subscrever).
// O Supabase limpa o URL ao arrancar, por isso isto é lido antes de criar o cliente.
export const passwordLinkType =
  typeof window !== "undefined" ? (window.location.hash.match(/type=(recovery|invite)/) || [])[1] || null : null;

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
// Os dados da demo ficam neste browser e são temporários: recomeçam a cada
// nova visita (ver startDemoVisit) e apagam-se 48 h depois de criados, mesmo
// com a página aberta. Há também limites de registos.

const DEMO_KEY = "carmaintrack-demo-v1";
const DEMO_VISIT_KEY = "carmaintrack-demo-visit";
export const DEMO_TTL_HOURS = 48;
// Quantos registos se podem acrescentar aos exemplos (4 veículos, 4 clientes
// e 6 revisões); os limites totais são os exemplos + estes.
export const DEMO_EXTRA = { vehicles: 3, clients: 3, services: 5 };
const SEED_COUNTS = (({ vehicles, clients, services }) => ({
  vehicles: vehicles.length,
  clients: clients.length,
  services: services.length,
}))(demoSeed());
export const DEMO_LIMITS = Object.fromEntries(Object.entries(DEMO_EXTRA).map(([k, n]) => [k, SEED_COUNTS[k] + n]));

const LIMIT_NAMES = { vehicles: "veículos", clients: "clientes", services: "revisões" };
/** Mensagem de limite atingido na demo. */
export const demoLimitMessage = (table) =>
  `Na demonstração pode acrescentar até ${DEMO_EXTRA[table]} ${LIMIT_NAMES[table]} aos exemplos. Subscreva para registos ilimitados.`;

const demoExpired = (data) => !data?.createdAt || Date.now() - data.createdAt > DEMO_TTL_HOURS * 3600 * 1000;

function demoRead() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    const data = raw && JSON.parse(raw);
    if (data && !demoExpired(data)) return data;
  } catch {
    /* storage indisponível: usa os dados de exemplo em memória */
  }
  const seed = { ...demoSeed(), createdAt: Date.now() };
  demoWrite(seed);
  return seed;
}

/** true se os dados atuais da demo já passaram das 48 h. */
export function demoIsExpired() {
  try {
    return demoExpired(JSON.parse(localStorage.getItem(DEMO_KEY)));
  } catch {
    return false;
  }
}

/**
 * Entrada no painel da demo. Uma visita nova (separador novo, ou voltar à
 * demo depois de sair para outra página) começa com os dados de exemplo;
 * recarregar a página dentro da mesma visita mantém o que foi feito.
 */
export function startDemoVisit({ firstLoad }) {
  let ongoing = false;
  try {
    ongoing = firstLoad && sessionStorage.getItem(DEMO_VISIT_KEY) === "1";
    sessionStorage.setItem(DEMO_VISIT_KEY, "1");
  } catch {
    /* sem sessionStorage: cada entrada é uma visita nova */
  }
  if (!ongoing) resetDemo();
}

export function endDemoVisit() {
  try {
    sessionStorage.removeItem(DEMO_VISIT_KEY);
  } catch {
    /* ignora */
  }
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
  if (!res.ok) throw Object.assign(new Error(json.error || `Erro ${res.status}`), { status: res.status });
  return json;
}

// --- Identificação pela matrícula -------------------------------------------

// Na demonstração não há serviço de matrículas: os veículos de exemplo dão os
// seus próprios dados e as outras matrículas dão um carro de exemplo.
const SAMPLE_CARS = [
  { make: "Renault", model: "Clio", engine: "1.0 TCe" },
  { make: "Peugeot", model: "208", engine: "1.2 PureTech" },
  { make: "Volkswagen", model: "Golf", engine: "2.0 TDI" },
  { make: "Toyota", model: "Yaris", engine: "1.5 Hybrid" },
  { make: "Mercedes-Benz", model: "Classe A", engine: "180 d" },
  { make: "Seat", model: "Ibiza", engine: "1.0 TSI" },
  { make: "Citroën", model: "C3", engine: "1.2 PureTech" },
  { make: "BMW", model: "Série 1", engine: "116d" },
];

/**
 * Identifica o veículo pela matrícula: { found, make, model, engine, year }.
 * Fora da demo usa api/plate-lookup.js (serviço RegCheck, com cache).
 */
export async function lookupPlate(plate) {
  if (!isDemo) return api("plate-lookup", { plate });
  await new Promise((r) => setTimeout(r, 400));
  const known = demoSeed().vehicles.find((x) => x.plate === plate);
  if (known) {
    const [model, ...rest] = known.model.split(" ");
    return { found: true, make: known.make, model, engine: rest.join(" "), year: known.year, sample: true };
  }
  const hash = [...plate].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const car = SAMPLE_CARS[hash % SAMPLE_CARS.length];
  return { found: true, ...car, year: 2012 + (hash % 12), sample: true };
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
    if (!row.id && list.length >= DEMO_LIMITS[table])
      throw new Error(demoLimitMessage(table));
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
    if (table === "vehicles") {
      data.services = data.services.filter((s) => s.vehicle_id !== id);
      data.photos = (data.photos || []).filter((p) => p.vehicle_id !== id);
    }
    if (table === "clients")
      data.vehicles = data.vehicles.map((v) => (v.client_id === id ? { ...v, client_id: null } : v));
    demoWrite(data);
    return;
  }
  // Os ficheiros das fotografias não são apagados em cascata: apaga-os primeiro.
  if (table === "vehicles") {
    const { data: photos } = await supabase.from("vehicle_photos").select("path").eq("vehicle_id", id);
    if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path));
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// --- Fotografias dos veículos ------------------------------------------------
// Supabase: ficheiros no bucket privado "vehicle-photos" (pasta da oficina) e
// uma linha em vehicle_photos. Demo: imagens reduzidas no localStorage.

const PHOTO_BUCKET = "vehicle-photos";
export const DEMO_PHOTO_LIMIT = 5;

/** Fotografias de um veículo, da mais antiga para a mais recente: [{ id, url, path }]. */
export async function listPhotos(vehicleId) {
  if (isDemo) return (demoRead().photos || []).filter((p) => p.vehicle_id === vehicleId);
  const { data, error } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data.length) return [];
  const { data: signed, error: signError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(data.map((p) => p.path), 3600);
  if (signError) throw signError;
  return data.map((p, i) => ({ ...p, url: signed[i]?.signedUrl }));
}

/** Acrescenta uma fotografia (ficheiro de imagem) a um veículo, já reduzida. */
export async function addPhoto(vehicle, workshopId, file) {
  if (isDemo) {
    const data = demoRead();
    data.photos = data.photos || [];
    if (data.photos.length >= DEMO_PHOTO_LIMIT)
      throw new Error(`Na demonstração pode juntar até ${DEMO_PHOTO_LIMIT} fotografias. Subscreva para fotografias ilimitadas.`);
    const url = await resizeImage(file, 1000, "image/jpeg", 0.72);
    const photo = { id: uuid(), vehicle_id: vehicle.id, url, created_at: new Date().toISOString() };
    data.photos.push(photo);
    demoWrite(data);
    return photo;
  }
  const dataUrl = await resizeImage(file, 1600, "image/jpeg", 0.82);
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${workshopId}/${vehicle.id}/${uuid()}.jpg`;
  const { error: upError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (upError) throw upError;
  const { data, error } = await supabase.from("vehicle_photos").insert({ vehicle_id: vehicle.id, path }).select().single();
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw error;
  }
  return { ...data, url: dataUrl };
}

export async function removePhoto(photo) {
  if (isDemo) {
    const data = demoRead();
    data.photos = (data.photos || []).filter((p) => p.id !== photo.id);
    demoWrite(data);
    return;
  }
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.path]);
  const { error } = await supabase.from("vehicle_photos").delete().eq("id", photo.id);
  if (error) throw error;
}

/** Versão reduzida (para a foto principal do veículo e do portal) de uma fotografia. */
export async function photoAsMainImage(photo) {
  let source = photo.url;
  if (!isDemo) {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(photo.path);
    if (error) throw error;
    source = data;
  } else {
    source = await (await fetch(photo.url)).blob();
  }
  return resizeImage(source, 900);
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
