import { getPortalPrefix } from "./router.js";

export const FILTERS = ["Óleo", "Ar do motor", "Ar da cabine", "Combustível"];
export const SERVICE_TITLES = ["Mudança de óleo", "Revisão", "Reparação", "Inspeção pré-IPO", "Outro"];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtKm = (n) => (n == null || n === "" ? "—" : `${Number(n).toLocaleString("pt-PT")} km`);

export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function addMonths(iso, months) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d.toISOString().slice(0, 10);
}

/** Dias de hoje até `iso` (negativo se já passou). */
export function daysUntil(iso) {
  if (!iso) return null;
  const a = new Date(`${todayISO()}T12:00:00`);
  const b = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Math.round((b - a) / 86400000);
}

export const vehicleName = (v) => [v.make, v.model, v.year].filter(Boolean).join(" ");

export function sortServices(services) {
  return [...services].sort(
    (a, b) =>
      (b.date || "").localeCompare(a.date || "") ||
      (b.km ?? 0) - (a.km ?? 0) ||
      (b.created_at || "").localeCompare(a.created_at || "")
  );
}

/**
 * Estado da próxima revisão de um veículo, com base no último serviço.
 * Vence pelo que chegar primeiro: quilómetros ou data.
 */
export function vehicleStatus(vehicle, services, workshop) {
  const own = sortServices(services.filter((s) => s.vehicle_id === vehicle.id));
  const last = own[0];
  const nextKm = last?.next_km ?? null;
  const nextDate = last?.next_date ?? null;
  const kmLeft = nextKm != null ? nextKm - (vehicle.current_km || 0) : null;
  const daysLeft = daysUntil(nextDate);

  let status = "none";
  if (nextKm != null || nextDate) {
    const warnKm = workshop?.warn_km ?? 3000;
    const warnDays = workshop?.warn_days ?? 30;
    if ((kmLeft != null && kmLeft <= 0) || (daysLeft != null && daysLeft < 0)) status = "overdue";
    else if ((kmLeft != null && kmLeft <= warnKm) || (daysLeft != null && daysLeft <= warnDays)) status = "soon";
    else status = "ok";
  }
  return { status, last, count: own.length, services: own, nextKm, nextDate, kmLeft, daysLeft };
}

export const STATUS = {
  ok: { label: "Em dia", color: "var(--c-ok)" },
  soon: { label: "A vencer", color: "var(--c-warn)" },
  overdue: { label: "Atrasado", color: "var(--c-danger)" },
  none: { label: "Sem revisão", color: "var(--c-subtle)" },
};

/** Converte um número português/internacional para o formato do wa.me. */
export function waNumber(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && /^[29]/.test(d)) d = `351${d}`;
  return d;
}

export function waLink(phone, text) {
  const n = waNumber(phone);
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return n ? `https://wa.me/${n}${q}` : `https://wa.me/${q}`;
}

export const portalUrl = (token) => `${window.location.origin}${getPortalPrefix()}/v/${token}`;

export function reminderText(vehicle, st, workshop, clientName) {
  const first = (clientName || "").split(" ")[0];
  const hi = first ? `Olá ${first}` : "Olá";
  const when =
    st.status === "overdue"
      ? "já passou a data/quilometragem da próxima revisão"
      : "está quase na altura da próxima revisão";
  const parts = [];
  if (st.nextKm != null) parts.push(`aos ${fmtKm(st.nextKm)}`);
  if (st.nextDate) parts.push(`até ${fmtDate(st.nextDate)}`);
  return (
    `${hi}! Aqui é da ${workshop?.name || "oficina"}. ` +
    `O seu ${vehicleName(vehicle)} (${vehicle.plate}) ${when}` +
    (parts.length ? ` (${parts.join(" ou ")})` : "") +
    `. Quer marcar? Pode ver o histórico aqui: ${portalUrl(vehicle.public_token)}`
  );
}

export function shareText(vehicle, workshop, clientName) {
  const first = (clientName || "").split(" ")[0];
  return (
    `${first ? `Olá ${first}` : "Olá"}! Obrigado pela visita à ${workshop?.name || "oficina"}. ` +
    `Aqui está o histórico digital do seu ${vehicle.plate}, com o que foi feito e a próxima revisão: ` +
    portalUrl(vehicle.public_token)
  );
}

/** Lê uma imagem e reduz para caber em `max`px, devolvendo um data URL JPEG/PNG. */
export function resizeImage(file, max, type = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(type, 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export const normalizePlate = (p) => p.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
