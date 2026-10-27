import { useState } from "react";
import { Wrench } from "lucide-react";
import { signIn, signUp } from "../lib/db.js";
import { Button, Field } from "../components/ui.jsx";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") await signIn(email, password);
      else {
        const res = await signUp(email, password);
        if (!res.session)
          setMsg({ ok: true, text: "Conta criada. Confirme o email através do link que enviámos e depois entre." });
      }
    } catch (err) {
      const text = /invalid login/i.test(err.message)
        ? "Email ou palavra-passe incorretos."
        : /not confirmed/i.test(err.message)
          ? "Confirme primeiro o seu email (verifique a caixa de entrada)."
          : err.message;
      setMsg({ ok: false, text });
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand">
            <Wrench className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-white">Carmaintrack</h1>
          <p className="text-sm text-slate-400">Histórico digital e lembretes para oficinas</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-5">
          <Field label="Email">
            <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Palavra-passe">
            <input
              className="input"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {msg && (
            <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
              {msg.text}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMsg(null);
            }}
            className="w-full text-center text-sm text-slate-400 hover:text-white"
          >
            {mode === "login" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
