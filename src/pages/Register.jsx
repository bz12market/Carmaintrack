import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { api, signIn } from "../lib/db.js";
import { go } from "../lib/router.js";
import { Button, Field } from "../components/ui.jsx";
import { AuthShell, GoLink } from "../components/Brand.jsx";

// Página de regresso do Stripe: /registo?session_id=...
// O servidor confirma o pagamento e só então cria a conta (api/register.js).
export default function Register() {
  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(sessionId ? "" : "missing");
  const [form, setForm] = useState({ workshop: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api("register", { session_id: sessionId, action: "info" })
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [sessionId]);

  async function create(e) {
    e.preventDefault();
    setMsg("");
    if (form.password.length < 8) return setMsg("A palavra-passe tem de ter pelo menos 8 caracteres.");
    if (form.password !== form.confirm) return setMsg("As palavras-passe não coincidem.");
    setBusy(true);
    try {
      await api("register", { session_id: sessionId, password: form.password, workshop_name: form.workshop });
      await signIn(info.email, form.password);
      go("/app");
    } catch (err) {
      setMsg(err.message);
      setBusy(false);
    }
  }

  async function link() {
    setBusy(true);
    setMsg("");
    try {
      await api("register", { session_id: sessionId });
      setLinked(true);
    } catch (err) {
      setMsg(err.message);
    }
    setBusy(false);
  }

  if (error)
    return (
      <AuthShell title="Não foi possível confirmar o pagamento">
        <div className="card space-y-4 p-5 text-center text-sm text-ink-2">
          <p>
            {error === "missing"
              ? "Para criar conta, escolha primeiro um plano. A conta é criada logo a seguir ao pagamento."
              : error}
          </p>
          <GoLink to="/#precos" className="inline-block font-semibold text-brand hover:underline">
            Ver planos
          </GoLink>
        </div>
      </AuthShell>
    );

  if (!info)
    return (
      <AuthShell title="A confirmar o pagamento…">
        <div className="flex justify-center">
          <Loader2 className="animate-spin text-subtle" size={28} />
        </div>
      </AuthShell>
    );

  if (info.registered || linked)
    return (
      <AuthShell title={linked ? "Subscrição ativada" : "Esta subscrição já tem conta"}>
        <div className="card space-y-4 p-5 text-center text-sm text-ink-2">
          <CheckCircle2 className="mx-auto text-ok" size={32} />
          <p>
            Entre com <b className="text-ink">{info.email}</b> e a sua palavra-passe.
          </p>
          <Button className="w-full" onClick={() => go("/entrar")}>
            Entrar
          </Button>
        </div>
      </AuthShell>
    );

  if (info.hasAccount)
    return (
      <AuthShell title="Pagamento confirmado" subtitle={`Já existe uma conta com ${info.email}.`}>
        <div className="card space-y-4 p-5 text-sm text-ink-2">
          <p>A nova subscrição fica associada a essa conta. Os dados que já tinha continuam lá.</p>
          {msg && <p className="rounded-xl bg-danger/10 px-3 py-2 text-danger">{msg}</p>}
          <Button className="w-full" disabled={busy} onClick={link}>
            Ativar na minha conta
          </Button>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell title="Pagamento confirmado" subtitle="Falta só criar o acesso ao painel.">
      <form onSubmit={create} className="card space-y-4 p-5">
        <Field label="Email">
          <input className="input opacity-70" value={info.email} readOnly />
        </Field>
        <Field label="Nome da oficina">
          <input
            className="input"
            value={form.workshop}
            onChange={(e) => setForm({ ...form, workshop: e.target.value })}
            placeholder="Ex.: Auto Silva"
            autoFocus
          />
        </Field>
        <Field label="Palavra-passe (mín. 8 caracteres)">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Repetir palavra-passe">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </Field>
        {msg && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{msg}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          Criar conta e entrar
        </Button>
      </form>
    </AuthShell>
  );
}
