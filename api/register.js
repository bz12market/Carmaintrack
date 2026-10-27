// POST /api/register
//   { session_id, action: "info" }                 -> { email, hasAccount, registered }
//   { session_id, password, workshop_name? }       -> cria a conta e associa a subscrição
//
// Só aceita sessões de checkout do Stripe concluídas com uma subscrição ativa:
// é isto que garante que não há registo sem subscrição. O session_id só é
// conhecido de quem pagou (vem no URL de regresso do Stripe).
import {
  HttpError,
  findUserIdByEmail,
  getAdmin,
  getStripe,
  handle,
  json,
  readJson,
  subscriptionRow,
} from "./_lib.js";

async function paidSession(sessionId) {
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

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const admin = getAdmin();
  const { sub, email } = await paidSession(body.session_id);

  const { data: registered, error: regError } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (regError) throw regError;
  const existingUserId = await findUserIdByEmail(admin, email);

  if (body.action === "info") {
    return json(200, { email, hasAccount: !!existingUserId, registered: !!registered });
  }

  if (registered) throw new HttpError(409, "Esta subscrição já tem conta. Entre com o seu email e palavra-passe.");

  // Quem já tem conta (p.ex. renovou depois de cancelar) fica com a subscrição
  // associada à conta existente; a palavra-passe dessa conta não é alterada.
  let userId = existingUserId;
  if (!userId) {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) throw new HttpError(400, "A palavra-passe tem de ter pelo menos 8 caracteres.");
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;

    const name = typeof body.workshop_name === "string" ? body.workshop_name.trim().slice(0, 120) : "";
    if (name) {
      const { error: wsError } = await admin.from("workshops").insert({ owner_id: userId, name });
      if (wsError) throw wsError;
    }
  }

  const { error } = await admin
    .from("subscriptions")
    .upsert({ user_id: userId, ...subscriptionRow(sub) }, { onConflict: "user_id" });
  if (error) throw error;

  // Guarda o user_id na subscrição para o webhook encontrar a conta.
  await getStripe().subscriptions.update(sub.id, { metadata: { ...sub.metadata, user_id: userId } });

  return json(200, { email, existed: !!existingUserId });
});
