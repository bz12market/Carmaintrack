import { Wrench } from "lucide-react";
import { go } from "../lib/router.js";

/** Logótipo do produto (não da oficina), usado nas páginas públicas. */
export function Brand({ size = 36, onClick }) {
  return (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        (onClick || (() => go("/")))();
      }}
      className="flex items-center gap-2.5"
    >
      <span
        className="flex items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent"
        style={{ width: size, height: size }}
      >
        <Wrench className="text-on-brand" size={size * 0.52} />
      </span>
      <span className="text-lg font-black tracking-tight text-ink">Carmaintrack</span>
    </a>
  );
}

/** Link para outra zona da app (landing, /entrar, /demo, /app). */
export function GoLink({ to, className = "", children }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.button !== 0) return;
        if (to.includes("#") && window.location.pathname === "/") return; // âncora na própria página
        e.preventDefault();
        go(to);
        const hash = to.split("#")[1];
        if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
      }}
    >
      {children}
    </a>
  );
}

/** Moldura simples para as páginas de conta (login, registo, ...). */
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Brand size={44} />
          {title && <h1 className="mt-2 text-xl font-bold text-ink">{title}</h1>}
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
