// Código partilhado pelas funções do servidor (Vercel). Ficheiros começados
// por "_" não são expostos como rotas.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { PLANS } from "../src/config/plans.js";

export const env = (name) => (process.env[name] || "").trim();

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Envolve um handler: erros esperados viram {error}, os outros são registados. */
export function handle(fn) {
  return async (request) => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message });
      console.error(err);
      return json(500, { error: "Ocorreu um erro no servidor. Tente novamente." });
    }
  };
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// --- Clientes (substituíveis nos testes) -------------------------------------

let stripeClient = null;
let adminClient = null;

export function setClients({ stripe, admin }) {
  stripeClient = stripe ?? stripeClient;
  adminClient = admin ?? adminClient;
}

export function getStripe() {
  if (!stripeClient) {
    const key = env("STRIPE_SECRET_KEY");
    if (!key) throw new Error("STRIPE_SECRET_KEY não está definida.");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function supabaseUrl() {
  const raw = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

/** Cliente com a service role: ignora RLS. Nunca chega ao browser. */
export function getAdmin() {
  if (!adminClient) {
    const url = supabaseUrl();
    const key = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não estão definidas.");
    adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}

// --- Utilitários --------------------------------------------------------------

export function appOrigin(request) {
  const configured = env("APP_URL");
  return configured ? new URL(configured).origin : new URL(request.url).origin;
}

/** Plano ativo + id do preço no Stripe (variável STRIPE_PRICE_<ID>). */
export function priceFor(planId) {
  const plan = PLANS.find((p) => p.id === planId && p.enabled);
  if (!plan) throw new HttpError(400, "Plano inválido.");
  const name = `STRIPE_PRICE_${plan.id.toUpperCase()}`;
  const price = env(name);
  if (!price) throw new Error(`${name} não está definida.`);
  return { plan, price };
}

/** Utilizador da sessão Supabase enviada em "Authorization: Bearer <token>". */
export async function userFromRequest(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sessão em falta.");
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Sessão inválida. Entre de novo.");
  return data.user;
}

/** Linha da tabela subscriptions a partir de uma subscrição do Stripe. */
export function subscriptionRow(sub) {
  // Nas versões mais recentes da API o fim do período está no item.
  const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  return {
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    status: sub.status,
    plan: sub.metadata?.plan || null,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

export async function findUserIdByEmail(admin, email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
