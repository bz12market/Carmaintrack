// Planos mostrados na landing page. O valor cobrado é o do preço no Stripe
// (variável STRIPE_PRICE_<ID> no servidor); aqui fica só o texto a mostrar,
// por isso, se mudares o preço no Stripe, muda-o também aqui.
// Os preços são sem IVA; o IVA é acrescentado pelo Stripe (STRIPE_TAX_RATE_ID).
// Um plano com enabled: false não aparece nem pode ser subscrito.

export const TRIAL_DAYS = 14;

export const PLANS = [
  {
    id: "mensal",
    enabled: true,
    name: "Mensal",
    price: "11,98 €",
    period: "/mês",
    note: "+ IVA · cancele quando quiser",
    highlight: false,
  },
  {
    id: "anual",
    enabled: true,
    name: "Anual",
    price: "115 €",
    period: "/ano",
    note: "+ IVA · equivale a 9,58 €/mês",
    // 12 × 11,98 € = 143,76 €; 115 € é 20% menos (poupa 28,76 € por ano).
    saving: "Poupa 28,76 € por ano face ao mensal",
    badge: "Poupe 20%",
    highlight: true,
  },
];

export const PLAN_FEATURES = [
  "Veículos e clientes ilimitados",
  "Histórico digital com a sua marca",
  "Etiquetas QR para o para-brisas",
  "Lembretes de revisão por WhatsApp",
  "Portal do cliente sem instalar nada",
  "Atualizações incluídas",
];

export const enabledPlans = () => PLANS.filter((p) => p.enabled);
