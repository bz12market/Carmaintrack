import { useState } from "react";
import {
  Home,
  Users,
  Bell,
  QrCode,
  Palette,
  LogOut,
  Menu,
  X,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useStore } from "../lib/store.js";
import { isDemo, signOut } from "../lib/db.js";
import { go } from "../lib/router.js";
import { Link, Button } from "./ui.jsx";
import DemoGuide from "./DemoGuide.jsx";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/veiculos", label: "Clientes e veículos", icon: Users },
  { to: "/lembretes", label: "Lembretes", icon: Bell, badge: true },
  { to: "/cartoes", label: "Etiquetas e QR", icon: QrCode },
  { to: "/personalizar", label: "Personalizar", icon: Palette },
];

export function Logo({ workshop, size = 40 }) {
  if (workshop?.logo_url)
    return (
      <img
        src={workshop.logo_url}
        alt=""
        className="rounded-xl bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  return (
    <div className="flex items-center justify-center rounded-xl bg-brand" style={{ width: size, height: size }}>
      <Wrench className="text-on-brand" size={size * 0.5} />
    </div>
  );
}

export default function Layout({ path, email, children }) {
  const { data, statuses, openRecord, openService } = useStore();
  const [open, setOpen] = useState(false);
  const alerts = Object.values(statuses).filter((s) => s.status === "overdue" || s.status === "soon").length;
  const active = (to) => (to === "/" ? path === "/" : path.startsWith(to));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <Logo workshop={data.workshop} />
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{data.workshop.name}</p>
          <p className="truncate text-xs text-subtle">Painel da oficina</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, badge }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active(to)
                ? "border border-brand/40 bg-brand/15 text-ink"
                : "border border-transparent text-muted hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && alerts > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{alerts}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t border-line p-3">
        <p className="truncate px-3 text-xs text-subtle">{email}</p>
        {!isDemo && (
          <button
            onClick={() => signOut().then(() => go("/entrar"))}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-ink/5"
          >
            <LogOut size={18} /> Sair
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-64 print:pl-0">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface">
            <button
              className="absolute top-5 right-3 rounded-lg p-1.5 text-muted"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {isDemo && <DemoGuide />}
      <header className="no-print sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur">
        <button className="rounded-lg p-2 text-ink-2 hover:bg-ink/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu size={20} />
        </button>
        <p className="flex-1 truncate font-semibold text-ink">
          {NAV.find((n) => active(n.to))?.label ?? "Veículo"}
        </p>
        <Button variant="ghost" className="!px-3" onClick={() => openService()}>
          <Wrench size={16} /> <span className="hidden sm:inline">Registar revisão</span>
        </Button>
        <Button className="!px-3" onClick={() => openRecord()}>
          <UserPlus size={16} /> <span className="hidden sm:inline">Novo registo</span>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 print:m-0 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
