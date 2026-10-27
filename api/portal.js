// POST /api/portal (com sessão) -> { url } do portal de faturação do Stripe,
// onde a oficina vê faturas, troca o cartão ou cancela a subscrição.
import { HttpError, appOrigin, getAdmin, getStripe, handle, json, userFromRequest } from "./_lib.js";

export const POST = handle(async (request) => {
  const user = await userFromRequest(request);
  const { data, error } = await getAdmin()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data?.stripe_customer_id) throw new HttpError(404, "Esta conta não tem uma subscrição paga no Stripe.");

  const session = await getStripe().billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${appOrigin(request)}/app/personalizar`,
    locale: "pt",
  });
  return json(200, { url: session.url });
});
