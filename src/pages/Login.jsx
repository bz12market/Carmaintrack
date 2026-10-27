import { useState } from "react";
import { signIn, sendPasswordReset } from "../lib/db.js";
import { go } from "../lib/router.js";
import { Button, Field } from "../components/ui.jsx";
import { AuthShell, GoLink } from "../components/Brand.jsx";

// As contas só são criadas depois de subscrever (ver /registo), por isso aqui
// não há "criar conta": quem não é cliente é encaminhado para os planos.
export default function Login() {
  const [mode, setMode] = useState("login"); // login | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        if (!window.location.pathname.startsWith("/app")) go("/app");
      } else {
        await sendPasswordReset(email.trim());
        setMsg({ ok: true, text: "Se existir uma conta com este email, vai receber um link para definir uma nova palavra-passe." });
      }
    } catch (err) {
      const text = /invalid login/i.test(err.message)
        ? "Email ou palavra-passe incorretos."
        : /rate limit/i.test(err.message)
          ? "Demasiados pedidos. Aguarde alguns minutos e tente de novo."
          : err.message;
      setMsg({ ok: false, text });
    }
    setBusy(false);
  }

  return (
    <AuthShell
      title={mode === "login" ? "Entrar no painel" : "Recuperar palavra-passe"}
      subtitle="Histórico digital e lembretes para oficinas"
    >
      <form onSubmit={submit} className="card space-y-4 p-5">
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {mode === "login" && (
          <Field label="Palavra-passe">
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        )}
        {msg && (
          <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
            {msg.text}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {mode === "login" ? "Entrar" : "Enviar link"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "reset" : "login");
            setMsg(null);
          }}
          className="w-full text-center text-sm text-slate-400 hover:text-white"
        >
          {mode === "login" ? "Esqueci-me da palavra-passe" : "Voltar ao login"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Ainda não é cliente?{" "}
        <GoLink to="/#precos" className="font-semibold text-brand hover:underline">
          Ver planos
        </GoLink>{" "}
        ou{" "}
        <GoLink to="/demo" className="font-semibold text-brand hover:underline">
          experimentar a demo
        </GoLink>
      </p>
    </AuthShell>
  );
}
