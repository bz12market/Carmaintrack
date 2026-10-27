import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ClipboardList,
  FileWarning,
  MessageCircle,
  MessageSquareOff,
  Palette,
  Printer,
  QrCode,
  ScanLine,
  Smartphone,
  Sticker,
  UserX,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { api } from "../lib/db.js";
import { PLAN_FEATURES, TRIAL_DAYS, enabledPlans } from "../config/plans.js";
import Label, { LABEL_SIZES } from "../components/Label.jsx";
import { Brand, GoLink } from "../components/Brand.jsx";

const DEMO_TOKEN = "demo0000000000000000001a";

function Section({ id, eyebrow, title, intro, children, className = "" }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {eyebrow && <p className="mb-3 text-xs font-bold tracking-[0.2em] text-orange-400 uppercase">{eyebrow}</p>}
            {title && <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>}
            {intro && <p className="mt-4 text-lg text-slate-400">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function PrimaryCta({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-900/40 transition hover:brightness-110 ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryCta({ to, children }) {
  return (
    <GoLink
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white hover:bg-white/10"
    >
      {children}
    </GoLink>
  );
}

function PhoneFrame({ src, alt, className = "" }) {
  return (
    <div className={`rounded-[2.2rem] border-[6px] border-slate-800 bg-black p-1 shadow-2xl shadow-black/60 ${className}`}>
      <img src={src} alt={alt} className="w-full rounded-[1.7rem]" loading="lazy" />
    </div>
  );
}

// Etiqueta de exemplo, desenhada com o mesmo componente que a app imprime.
const SAMPLE = {
  vehicle: { plate: "AN-55-QZ", make: "Mercedes-Benz", model: "Classe A 180 d", year: 2021, public_token: DEMO_TOKEN },
  workshop: { name: "Oficina Auto Rápida", tagline: "Histórico de revisões", logo_url: "" },
  status: { nextKm: 87100, nextDate: "2027-04-15" },
};

function Checkout({ plan, label, className = "" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const { url } = await api("checkout", { plan: plan.id });
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Não foi possível abrir o pagamento.");
      setBusy(false);
    }
  }
  return (
    <div className={className}>
      <PrimaryCta onClick={start} className="w-full">
        {busy ? "A abrir o pagamento…" : label}
      </PrimaryCta>
      {error && <p className="mt-2 text-center text-sm text-red-300">{error}</p>}
    </div>
  );
}

function Faq({ q, children }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 open:bg-white/[0.05]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
        {q}
        <ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-slate-400">{children}</div>
    </details>
  );
}

export default function Landing() {
  const plans = enabledPlans();
  const mainPlan = plans.find((p) => p.highlight) || plans[0];
  const trial = TRIAL_DAYS > 0 ? `Experimentar ${TRIAL_DAYS} dias grátis` : "Subscrever";
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", "#f97316");
    document.title = "Carmaintrack — Histórico digital e etiquetas QR para oficinas";
    const hash = window.location.hash.slice(1);
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
  }, []);

  return (
    <div className="overflow-x-hidden bg-[#08090d]">
      {/* Navegação */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08090d]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <nav className="hidden flex-1 gap-6 text-sm text-slate-400 md:flex">
            {[
              ["como", "Como funciona"],
              ["funcionalidades", "Funcionalidades"],
              ["precos", "Preços"],
              ["faq", "Perguntas"],
            ].map(([id, l]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white">
                {l}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <GoLink to="/entrar" className="px-2 py-2 text-sm font-semibold whitespace-nowrap text-slate-300 hover:text-white sm:px-3">
              Entrar
            </GoLink>
            <GoLink
              to="/demo"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold whitespace-nowrap text-slate-900 hover:bg-orange-50"
            >
              Ver demo
            </GoLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pt-14 pb-20 sm:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.22),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
              <Wrench size={13} /> Para oficinas e centros de mudança de óleo
            </p>
            <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
              O carro sai da oficina.{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                A sua oficina fica com ele.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Registe cada revisão, cole uma etiqueta com QR no para-brisas e o cliente passa a ter no telemóvel o
              histórico do carro, a próxima revisão e o seu contacto. Sem papel e sem aplicações para instalar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta onClick={() => scrollTo("precos")}>
                {trial} <ArrowRight size={18} />
              </PrimaryCta>
              <SecondaryCta to="/demo">Ver a demonstração</SecondaryCta>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              {["Sem fidelização", "Matrículas e km portugueses", "Funciona no telemóvel e no computador"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check size={15} className="text-green-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <img
              src="/screens/painel.jpg"
              alt="Painel da oficina no Carmaintrack"
              className="w-full rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
            />
            <PhoneFrame
              src="/screens/portal.jpg"
              alt="Histórico do carro no telemóvel do cliente"
              className="absolute -bottom-10 -left-4 w-[34%] sm:-left-8"
            />
          </div>
        </div>
      </section>

      {/* Problema */}
      <Section
        eyebrow="O problema"
        title="Fazer um bom trabalho já não chega para o cliente voltar"
        intro="Depois da entrega, a informação dispersa-se e a sua oficina desaparece da memória do cliente."
        className="bg-white/[0.02]"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [FileWarning, "O autocolante de papel", "Descola, apaga-se com o sol e quase ninguém o lê até ser tarde."],
            [MessageSquareOff, "Conversas no WhatsApp", "Servem para combinar, não para guardar o histórico de um carro."],
            [UserX, "A marca perde-se", "Na próxima revisão o cliente vai onde estiver mais perto, não onde foi bem servido."],
            [ClipboardList, "Tudo na cabeça do dono", "Cada pessoa anota à sua maneira e encontrar uma revisão antiga demora."],
          ].map(([Icon, t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-[#0e1016] p-5">
              <Icon className="text-red-400" size={24} />
              <h3 className="mt-4 font-bold text-white">{t}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Como funciona */}
      <Section id="como" eyebrow="Como funciona" title="Três passos, sem mudar a forma como trabalha">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [Wrench, "Registe a revisão", "Matrícula, km, óleo, filtros e observações. A próxima revisão é calculada sozinha, por km e por data."],
            [Printer, "Cole a etiqueta", "Imprima a etiqueta com QR numa impressora de etiquetas ou em folhas A4 e cole-a no para-brisas."],
            [Bell, "O cliente volta", "Ele lê o QR e vê tudo no telemóvel. Quando a revisão se aproxima, envia-lhe um lembrete pelo WhatsApp."],
          ].map(([Icon, t, d], i) => (
            <div key={t} className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6">
              <span className="absolute top-5 right-6 text-5xl font-black text-white/5">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600">
                <Icon className="text-white" size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">{t}</h3>
              <p className="mt-2 text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Etiqueta */}
      <Section className="bg-white/[0.02]">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-orange-400 uppercase">A etiqueta</p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Cada carro sai com a sua etiqueta QR</h2>
            <p className="mt-4 text-lg text-slate-400">
              Substitui o autocolante da mudança de óleo. Mostra a matrícula, a próxima revisão e o nome da sua oficina,
              e o QR abre o histórico completo.
            </p>
            <ul className="mt-6 space-y-3 text-slate-300">
              {[
                "Impressoras térmicas de 4\" (100 mm), Brother QL, Niimbot ou folhas A4",
                "Versão a preto e branco para térmicas e versão a cores",
                "Logótipo, cor e contactos da sua oficina",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check size={18} className="mt-0.5 shrink-0 text-green-400" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <ScanLine size={16} /> Leia o QR com o telemóvel para ver um exemplo do histórico.
            </p>
          </div>
          <div className="flex flex-col items-center gap-5">
            <div className="origin-center scale-[0.85] sm:scale-100">
              <Label
                {...SAMPLE}
                size={LABEL_SIZES[0]}
                mode="color"
                qrUrl={`${window.location.origin}/demo/v/${DEMO_TOKEN}`}
              />
            </div>
            <div className="origin-center scale-[0.85] sm:scale-100">
              <Label
                {...SAMPLE}
                size={LABEL_SIZES[0]}
                mode="mono"
                qrUrl={`${window.location.origin}/demo/v/${DEMO_TOKEN}`}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Portal do cliente */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 flex justify-center gap-4 lg:order-1">
            <PhoneFrame src="/screens/portal.jpg" alt="Portal do cliente" className="w-[46%] max-w-[260px]" />
            <PhoneFrame src="/screens/portal-historico.jpg" alt="Histórico de revisões no portal" className="mt-12 w-[46%] max-w-[260px]" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-orange-400 uppercase">O que o cliente vê</p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">A sua oficina, sempre no telemóvel do cliente</h2>
            <p className="mt-4 text-lg text-slate-400">
              Um link ou um QR e pronto: abre no navegador, sem registos nem instalações.
            </p>
            <ul className="mt-6 space-y-3 text-slate-300">
              {[
                "Quilometragem, estado e próxima revisão em destaque",
                "Óleo e filtros usados, com o histórico completo em linha do tempo",
                "Aviso quando a revisão está a chegar ou atrasada",
                "Botões para marcar pelo WhatsApp ou ligar para a oficina",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check size={18} className="mt-0.5 shrink-0 text-green-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Funcionalidades */}
      <Section id="funcionalidades" eyebrow="Tudo num só sítio" title="Mais do que um histórico" className="bg-white/[0.02]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Users, "Clientes e veículos", "Procure por matrícula, nome ou telefone e encontre tudo num instante."],
            [Wrench, "Histórico de serviços", "Óleo, filtros, peças, reparações e observações de cada visita."],
            [Bell, "Lembretes", "Veja quem está em atraso ou quase a chegar e envie o lembrete num clique."],
            [MessageCircle, "WhatsApp", "Mensagens já escritas, com o link do histórico do carro."],
            [Sticker, "Etiquetas QR", "Vários tamanhos, térmica ou a cores, em rolo ou folha A4."],
            [QrCode, "Portal do cliente", "Uma página por carro, com a marca e os contactos da oficina."],
            [Palette, "A sua marca", "Logótipo, cor principal, telefone, WhatsApp e morada."],
            [Smartphone, "Telemóvel e computador", "Use no balcão, na oficina ou em casa, no aparelho que já tem."],
          ].map(([Icon, t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-[#0e1016] p-5">
              <Icon className="text-orange-400" size={22} />
              <h3 className="mt-3 font-bold text-white">{t}</h3>
              <p className="mt-1 text-sm text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparação */}
      <Section eyebrow="A diferença" title="Papel e WhatsApp resolvem metade. O Carmaintrack junta tudo.">
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#0e1016] p-6">
            <h3 className="font-bold text-slate-300">Como é hoje</h3>
            <ul className="mt-4 space-y-3 text-slate-400">
              {["O autocolante perde-se ou fica ilegível", "O histórico está espalhado em conversas e cadernos", "Depende da memória do cliente", "A oficina desaparece depois da entrega"].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <X size={18} className="mt-0.5 shrink-0 text-red-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-orange-500/40 bg-gradient-to-b from-orange-500/15 to-transparent p-6">
            <h3 className="font-bold text-white">Com o Carmaintrack</h3>
            <ul className="mt-4 space-y-3 text-slate-200">
              {["Etiqueta com QR que leva ao histórico", "Tudo guardado por veículo e fácil de encontrar", "Próxima revisão visível e lembretes", "A sua marca e contactos sempre à mão do cliente"].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check size={18} className="mt-0.5 shrink-0 text-green-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Preços */}
      <Section
        id="precos"
        eyebrow="Preços"
        title="Um preço simples, sem surpresas"
        intro={TRIAL_DAYS > 0 ? `Experimente ${TRIAL_DAYS} dias sem pagar. Se não gostar, cancela antes e não paga nada.` : undefined}
        className="bg-white/[0.02]"
      >
        <div className={`mx-auto grid max-w-3xl gap-6 ${plans.length > 1 ? "md:grid-cols-2" : "max-w-md"}`}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl border p-7 ${
                plan === mainPlan ? "border-orange-500/50 bg-gradient-to-b from-orange-500/15 to-[#0e1016]" : "border-white/10 bg-[#0e1016]"
              }`}
            >
              {plan === mainPlan && plans.length > 1 && (
                <span className="absolute -top-3 left-7 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">Mais escolhido</span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-black text-white">{plan.price}</span>
                <span className="mb-1.5 text-slate-400">{plan.period}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">{plan.note}</p>
              <ul className="mt-6 space-y-2.5 text-slate-300">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check size={18} className="mt-0.5 shrink-0 text-green-400" /> {f}
                  </li>
                ))}
              </ul>
              <Checkout plan={plan} label={trial} className="mt-7" />
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Pagamento seguro com cartão ou débito direto SEPA através do Stripe. A conta é criada logo a seguir ao pagamento.
        </p>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="Perguntas frequentes" title="Antes de começar">
        <div className="mx-auto max-w-3xl space-y-3">
          <Faq q="Para que tipo de negócio é?">
            Oficinas mecânicas, centros de mudança de óleo, centros auto e outros serviços de manutenção com clientes que voltam.
          </Faq>
          <Faq q="O cliente tem de instalar alguma aplicação?">
            Não. Abre o histórico no navegador do telemóvel, pelo QR da etiqueta ou por um link enviado no WhatsApp.
          </Faq>
          <Faq q="Que impressora preciso para as etiquetas?">
            Qualquer uma. Funciona com impressoras térmicas de etiquetas de 4&quot; (100 mm), Brother QL (62 mm), impressoras
            portáteis tipo Niimbot (50×30 mm) ou com uma impressora normal em folhas A4 de autocolantes.
          </Faq>
          <Faq q="A próxima revisão pode ser por quilómetros ou por data?">
            Pelas duas: vence a que chegar primeiro. Os intervalos e os avisos ajustam-se nas definições.
          </Faq>
          <Faq q="Posso registar outros serviços além da mudança de óleo?">
            Sim: filtros, travões, baterias, diagnósticos, peças e reparações, com observações para o cliente.
          </Faq>
          <Faq q="Há fidelização? Como cancelo?">
            Não há fidelização. Cancela quando quiser na área "Personalizar → Subscrição" e mantém o acesso até ao fim do período pago.
          </Faq>
          <Faq q="O que acontece aos meus dados se cancelar?">
            Ficam guardados. Se voltar a subscrever com o mesmo email, encontra tudo como deixou.
          </Faq>
        </div>
      </Section>

      {/* CTA final */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-orange-500/30 bg-gradient-to-br from-orange-500/25 via-red-600/10 to-transparent p-10 text-center sm:p-14">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Transforme a próxima revisão no primeiro histórico digital</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">Comece hoje. Em cinco minutos tem a oficina configurada e a primeira etiqueta impressa.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryCta onClick={() => scrollTo("precos")}>
              {trial} <ArrowRight size={18} />
            </PrimaryCta>
            <SecondaryCta to="/demo">Ver a demonstração</SecondaryCta>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <Brand size={28} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <div className="flex gap-5">
            <GoLink to="/demo" className="hover:text-white">
              Demonstração
            </GoLink>
            <GoLink to="/entrar" className="hover:text-white">
              Entrar
            </GoLink>
            <button onClick={() => scrollTo("precos")} className="hover:text-white">
              Preços
            </button>
          </div>
          <p>© {new Date().getFullYear()} Carmaintrack</p>
        </div>
      </footer>
    </div>
  );
}
