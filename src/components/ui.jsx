import { useEffect } from "react";
import { X, Car } from "lucide-react";
import { STATUS } from "../lib/util.js";
import { navigate, href } from "../lib/router.js";

export function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-brand text-on-brand hover:brightness-110",
    ghost: "border border-line bg-ink/5 text-ink-2 hover:bg-ink/10",
    danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
    whatsapp: "bg-[#25d366] text-white hover:brightness-105",
  };
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`;
  // Com href, é um link externo com aspeto de botão.
  if (props.href)
    return props.href.startsWith("http") ? (
      <a target="_blank" rel="noreferrer" className={cls} {...props} />
    ) : (
      <a className={cls} {...props} />
    );
  return <button type="button" className={cls} {...props} />;
}

export function Link({ to, className = "", children, ...props }) {
  return (
    <a
      href={href(to)}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface sm:rounded-3xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-ink/10" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status, className = "" }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{ color: s.color, background: `color-mix(in oklab, ${s.color} 14%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function VehiclePhoto({ vehicle, className = "" }) {
  if (vehicle.photo_url)
    return <img src={vehicle.photo_url} alt={vehicle.plate} className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand/40 to-accent/30 ${className}`}>
      <Car className="text-ink/70" size={28} />
    </div>
  );
}

export function Plate({ children, className = "" }) {
  return <span className={`font-plate font-bold tracking-[0.12em] ${className}`}>{children}</span>;
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      {Icon && <Icon className="text-subtle" size={32} />}
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}
