// Planos mostrados na landing page. O valor cobrado é o do preço no Stripe
// (variável STRIPE_PRICE_<ID> no servidor); aqui fica só o texto a mostrar,
// por isso, se mudares o preço no Stripe, muda-o também aqui.
// Um plano com enabled: false não aparece nem pode ser subscrito.

export const TRIAL_DAYS = 14;

export const PLANS = [
  {
    id: "mensal",
    enabled: true,
    name: "Mensal",
    price: "19,90 €",
    period: "/mês",
    note: "+ IVA · cancele quando quiser",
    highlight: true,
  },
  {
    id: "anual",
    enabled: false,
    name: "Anual",
    price: "199 €",
    period: "/ano",
    note: "+ IVA · 2 meses grátis",
    highlight: false,
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
