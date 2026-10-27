// POST /api/stripe-webhook — o Stripe avisa aqui das renovações, falhas de
// pagamento e cancelamentos, e a tabela subscriptions é atualizada.
// Eventos a ativar no Stripe: customer.subscription.created/updated/deleted.
import { HttpError, env, getAdmin, getStripe, handle, json, subscriptionRow } from "./_lib.js";

export const POST = handle(async (request) => {
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET não está definida.");

  const payload = await request.text();
  let event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, request.headers.get("stripe-signature"), secret);
  } catch {
    throw new HttpError(400, "Assinatura do webhook inválida.");
  }

  if (event.type.startsWith("customer.subscription.")) {
    // Os eventos podem chegar fora de ordem: lê sempre o estado atual.
    const sub = await getStripe().subscriptions.retrieve(event.data.object.id);
    const row = subscriptionRow(sub);
    const admin = getAdmin();

    const { data, error } = await admin
      .from("subscriptions")
      .update(row)
      .eq("stripe_subscription_id", sub.id)
      .select("user_id");
    if (error) throw error;

    // Ainda sem linha (conta criada depois do evento): usa o user_id guardado
    // nos metadados por api/register.js. Sem ele, o registo trata do resto.
    if (data.length === 0 && sub.metadata?.user_id) {
      const { error: upError } = await admin
        .from("subscriptions")
        .upsert({ user_id: sub.metadata.user_id, ...row }, { onConflict: "user_id" });
      if (upError) throw upError;
    }
  }

  return json(200, { received: true });
});
