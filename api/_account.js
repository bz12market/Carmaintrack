// Ligação entre um pagamento no Stripe e a conta no Supabase, usada pelo
// registo (api/register.js) e pelo webhook (api/stripe-webhook.js).
import { HttpError, findUserByEmail, getAdmin, getStripe, subscriptionRow } from "./_lib.js";

/** Sessão de checkout concluída, com subscrição ativa, e o email de quem pagou. */
export async function paidSession(sessionId) {
  if (!sessionId || typeof sessionId !== "string") throw new HttpError(400, "Pagamento não indicado.");
  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  } catch {
    throw new HttpError(404, "Pagamento não encontrado.");
  }
  const sub = session.subscription;
  if (session.mode !== "subscription" || session.status !== "complete" || !sub || typeof sub === "string")
    throw new HttpError(402, "O pagamento ainda não foi concluído.");
  if (!["active", "trialing"].includes(sub.status)) throw new HttpError(402, "A subscrição não está ativa.");
  const email = (session.customer_details?.email || session.customer_email || "").trim().toLowerCase();
  if (!email) throw new HttpError(400, "O pagamento não tem email associado.");
  return { sub, email };
}

/**
 * Situação da conta para uma subscrição:
 *  - registered: a subscrição já está associada a uma conta;
 *  - user: conta existente com o email do pagamento (ou null);
 *  - pending: a conta foi criada por convite (webhook) para esta subscrição e
 *    ainda ninguém entrou nela, por isso quem pagou ainda pode definir a
 *    palavra-passe na página de registo.
 */
export async function accountFor(sub, email) {
  const admin = getAdmin();
  const { data: registered, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (error) throw error;
  const user = await findUserByEmail(admin, email);
  const pending = !!user && isUnusedInvite(user) && (!registered || registered.user_id === user.id);
  return { registered, user, pending };
}

/** Conta criada por convite em que ainda ninguém entrou. */
export const isUnusedInvite = (user) => !!user.invited_at && !user.last_sign_in_at;

/** Associa a subscrição à conta (tabela subscriptions e metadados no Stripe). */
export async function linkSubscription(userId, sub) {
  const { error } = await getAdmin()
    .from("subscriptions")
    .upsert({ user_id: userId, ...subscriptionRow(sub) }, { onConflict: "user_id" });
  if (error) throw error;
  // Guarda o user_id na subscrição para o webhook encontrar a conta.
  await getStripe().subscriptions.update(sub.id, { metadata: { ...sub.metadata, user_id: userId } });
}

/** Cria a oficina com o nome indicado, se a conta ainda não tiver uma. */
export async function ensureWorkshop(userId, name) {
  const clean = typeof name === "string" ? name.trim().slice(0, 120) : "";
  if (!clean) return;
  const admin = getAdmin();
  const { data, error } = await admin.from("workshops").select("id").eq("owner_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return;
  const { error: insError } = await admin.from("workshops").insert({ owner_id: userId, name: clean });
  if (insError) throw insError;
}

export const alreadyExists = (error) => /already|registered|exists/i.test(error?.message || "");

/**
 * Chamado pelo webhook quando o checkout termina: garante que existe conta
 * para a subscrição. Sem conta, cria-a por convite e o Supabase envia o email
 * "defina a sua palavra-passe" (link para /app). Devolve o que fez.
 */
export async function provisionFromCheckout(sessionId, origin) {
  let paid;
  try {
    paid = await paidSession(sessionId);
  } catch (err) {
    if (err instanceof HttpError) return "ignorado";
    throw err;
  }
  const { sub, email } = paid;
  const { registered, user } = await accountFor(sub, email);
  if (registered) return "já associada";

  if (user) {
    // Quem já tinha conta (renovação) fica com a subscrição nessa conta.
    await linkSubscription(user.id, sub);
    return "associada a conta existente";
  }

  const { data, error } = await getAdmin().auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/app` });
  if (error) {
    // A página de registo criou a conta entretanto: ela própria trata da ligação.
    if (alreadyExists(error)) return "criada pelo registo";
    throw error;
  }
  await linkSubscription(data.user.id, sub);
  return "convite enviado";
}

