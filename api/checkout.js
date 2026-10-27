// POST /api/checkout { plan } -> { url } da página de pagamento do Stripe.
// Depois do pagamento, o Stripe volta a /registo?session_id=..., onde a conta
// é criada (api/register.js). Não há registo sem passar por aqui.
import { TRIAL_DAYS } from "../src/config/plans.js";
import { appOrigin, env, getStripe, handle, json, priceFor, readJson } from "./_lib.js";

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const { plan, price } = priceFor(body.plan || "mensal");
  const origin = appOrigin(request);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    // Taxa de IVA do Stripe (tipo "exclusive"): os preços são sem IVA.
    line_items: [{ price, quantity: 1, ...(env("STRIPE_TAX_RATE_ID") ? { tax_rates: [env("STRIPE_TAX_RATE_ID")] } : {}) }],
    success_url: `${origin}/registo?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#precos`,
    locale: "pt",
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true }, // NIF da oficina na fatura
    metadata: { plan: plan.id },
    subscription_data: {
      metadata: { plan: plan.id },
      ...(TRIAL_DAYS > 0 ? { trial_period_days: TRIAL_DAYS } : {}),
    },
  });

  return json(200, { url: session.url });
});
