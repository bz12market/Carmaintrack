import { useState } from "react";
import { CreditCard, LogOut, RefreshCw } from "lucide-react";
import { api, isActive, isDemo, signOut, updatePassword } from "../lib/db.js";
import { go } from "../lib/router.js";
import { fmtDate } from "../lib/util.js";
import { Button, Field } from "../components/ui.jsx";
import { AuthShell } from "../components/Brand.jsx";

export const SUB_STATUS = {
  active: "Ativa",
  trialing: "Período experimental",
  past_due: "Pagamento em atraso",
  canceled: "Cancelada",
  unpaid: "Por pagar",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  paused: "Em pausa",
};

async function openBillingPortal(setMsg) {
  try {
    const { url } = await api("portal");
    window.location.href = url;
  } catch (e) {
    setMsg(e.message);
  }
}

/** Nova palavra-passe, depois do link de recuperação enviado por email. */
export function SetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setMsg("A palavra-passe tem de ter pelo menos 8 caracteres.");
    setBusy(true);
    try {
      await updatePassword(password);
      onDone();
    } catch (err) {
      setMsg(err.message);
      setBusy(false);
    }
  }
  return (
    <AuthShell title="Definir nova palavra-passe">
      <form onSubmit={submit} className="card space-y-4 p-5">
        <Field label="Nova palavra-passe (mín. 8 caracteres)">
          <input className="input" type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {msg && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{msg}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          Guardar e entrar
        </Button>
      </form>
    </AuthShell>
  );
}

/** Ecrã mostrado a quem tem login mas não tem subscrição ativa. */
export function SubscriptionRequired({ subscription, email, onRefresh }) {
  const [msg, setMsg] = useState("");
  const hasStripe = !!subscription?.stripe_customer_id;
  return (
    <AuthShell
      title={subscription ? "A subscrição não está ativa" : "Esta conta não tem subscrição"}
      subtitle={email}
    >
      <div className="card space-y-4 p-5 text-sm text-ink-2">
        {subscription && (
          <p>
            Estado: <b className="text-ink">{SUB_STATUS[subscription.status] || subscription.status}</b>
          </p>
        )}
        <p>Os seus dados ficam guardados. Para voltar a usar o painel e o portal dos clientes, renove a subscrição.</p>
        {msg && <p className="rounded-xl bg-danger/10 px-3 py-2 text-danger">{msg}</p>}
        {hasStripe && (
          <Button variant="ghost" className="w-full" onClick={() => openBillingPortal(setMsg)}>
            <CreditCard size={16} /> Ver faturas e pagamentos
          </Button>
        )}
        <Button className="w-full" onClick={() => go("/#precos")}>
          Subscrever de novo
        </Button>
        <p className="text-xs text-subtle">Use o mesmo email ({email}) no pagamento para a subscrição ficar nesta conta.</p>
        <div className="flex justify-between pt-2">
          <button onClick={onRefresh} className="flex items-center gap-1.5 text-muted hover:text-ink">
            <RefreshCw size={14} /> Verificar de novo
          </button>
          <button onClick={() => signOut().then(() => go("/entrar"))} className="flex items-center gap-1.5 text-muted hover:text-ink">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

/** Secção "Subscrição" em Personalizar. */
export function SubscriptionPanel({ subscription }) {
  const [msg, setMsg] = useState("");
  if (isDemo)
    return (
      <section className="card space-y-2 p-5">
        <h2 className="font-bold text-ink">Subscrição</h2>
        <p className="text-sm text-muted">Na demonstração não há subscrição. Os dados ficam só neste browser.</p>
      </section>
    );
  const s = subscription;
  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-bold text-ink">Subscrição</h2>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p className="text-muted">
          Estado: <b className={isActive(s) ? "text-ok" : "text-danger"}>{SUB_STATUS[s?.status] || s?.status || "—"}</b>
        </p>
        {s?.current_period_end && (
          <p className="text-muted">
            {s.cancel_at_period_end ? "Termina a" : s.status === "trialing" ? "Experimental até" : "Próxima renovação"}:{" "}
            <b className="text-ink">{fmtDate(s.current_period_end)}</b>
          </p>
        )}
      </div>
      {msg && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{msg}</p>}
      {s?.stripe_customer_id ? (
        <Button variant="ghost" onClick={() => openBillingPortal(setMsg)}>
          <CreditCard size={16} /> Gerir subscrição e faturas
        </Button>
      ) : (
        <p className="text-xs text-subtle">Subscrição atribuída manualmente (sem pagamentos no Stripe).</p>
      )}
    </section>
  );
}
