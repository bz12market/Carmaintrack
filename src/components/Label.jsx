import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Wrench } from "lucide-react";
import { fmtDate, fmtKm, portalUrl, vehicleName } from "../lib/util.js";

// Tamanhos de etiqueta mais comuns (largura × altura, como sai da impressora).
// As térmicas de 4" (100 mm) usam rolos 100×50 / 100×60; as Brother QL usam
// 62 mm; as portáteis (Niimbot) 50×30 ou 40×60. Mais altas do que largas são
// desenhadas na vertical.
export const LABEL_SIZES = [
  { id: "100x60", name: "100 × 60 mm", w: 100, h: 60, hint: "Térmica 4\" (recomendado)" },
  { id: "100x50", name: "100 × 50 mm", w: 100, h: 50, hint: "Térmica 4\"" },
  { id: "85x55", name: "85 × 55 mm", w: 85, h: 55, hint: "Cartão de visita" },
  { id: "62x29", name: "62 × 29 mm", w: 62, h: 29, hint: "Brother QL (62 mm)" },
  { id: "50x30", name: "50 × 30 mm", w: 50, h: 30, hint: "Portátil (Niimbot e similares)" },
  { id: "60x100", name: "60 × 100 mm", w: 60, h: 100, hint: "Térmica, rolo de 60 mm (recomendado)" },
  { id: "62x100", name: "62 × 100 mm", w: 62, h: 100, hint: "Brother QL (62 mm)" },
  { id: "55x85", name: "55 × 85 mm", w: 55, h: 85, hint: "Cartão de visita na vertical" },
  { id: "50x80", name: "50 × 80 mm", w: 50, h: 80, hint: "Térmica, rolo de 50 mm" },
  { id: "40x60", name: "40 × 60 mm", w: 40, h: 60, hint: "Portátil (Niimbot e similares)" },
];

export const isVertical = (size) => size.h > size.w;

// Tamanhos personalizados, criados em Personalizar e guardados na oficina
// (workshops.label_sizes = [{ w, h, name? }]).
// Abaixo de 25 mm (lado menor) / 35 mm (lado maior) a matrícula, os km, a data
// e o QR deixam de caber de forma legível.
export const CUSTOM_LIMITS = { minShort: 25, minLong: 35, maxW: 210, maxH: 300 };

/** Mensagem de erro para um tamanho personalizado inválido (ou "" se for válido). */
export function customSizeError(w, h) {
  const { minShort, minLong, maxW, maxH } = CUSTOM_LIMITS;
  if (!(w > 0 && h > 0)) return "Indique a largura e a altura em milímetros.";
  if (w > maxW || h > maxH) return `O máximo é ${maxW} mm de largura e ${maxH} mm de altura.`;
  if (Math.min(w, h) < minShort || Math.max(w, h) < minLong)
    return `A etiqueta tem de ter pelo menos ${minShort} × ${minLong} mm para caberem a matrícula, os km, a data e o QR.`;
  return "";
}

export function customSizes(workshop) {
  const list = Array.isArray(workshop?.label_sizes) ? workshop.label_sizes : [];
  return list
    .map((s) => ({ w: Math.round(Number(s.w)), h: Math.round(Number(s.h)), name: String(s.name || "").trim() }))
    .filter((s) => !customSizeError(s.w, s.h))
    .map((s) => ({
      id: `c-${s.w}x${s.h}`,
      name: `${s.w} × ${s.h} mm`,
      w: s.w,
      h: s.h,
      hint: s.name || `Personalizado (${isVertical(s) ? "vertical" : "horizontal"})`,
      custom: true,
    }));
}

/** Tamanhos predefinidos + personalizados da oficina. */
export const allSizes = (workshop) => [...LABEL_SIZES, ...customSizes(workshop)];

export function useQr(text) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 0, width: 480, errorCorrectionLevel: "M" }).then(setSrc);
  }, [text]);
  return src;
}

/** Quilómetros e data da próxima revisão ("—" quando não estão definidos). */
export function nextParts(st) {
  return {
    km: st?.nextKm != null ? fmtKm(st.nextKm) : "— km",
    date: st?.nextDate ? fmtDate(st.nextDate) : "—",
  };
}

/**
 * Próxima revisão, sempre com quilómetros e data. Cada valor nunca é partido
 * a meio: se não couberem lado a lado, a data passa para a linha seguinte.
 */
function NextService({ status, size, compact, align = "left", sub, prefix = true }) {
  const { km, date } = nextParts(status);
  return (
    <div className="leading-tight" style={{ textAlign: align }}>
      {!compact && (
        <p className="font-semibold uppercase" style={{ fontSize: mm(size * 0.72), color: sub, letterSpacing: "0.04em" }}>
          Próxima revisão
        </p>
      )}
      <p
        className="flex flex-wrap font-extrabold"
        style={{ fontSize: mm(size), columnGap: mm(size * 0.5), justifyContent: align === "center" ? "center" : "flex-start" }}
      >
        <span className="whitespace-nowrap">{compact && prefix ? `Próx.: ${km}` : km}</span>
        <span className="whitespace-nowrap">{date}</span>
      </p>
    </div>
  );
}

/**
 * Etiqueta autocolante para o para-brisas (ou cartão), na horizontal ou na
 * vertical conforme o tamanho.
 * mode "color": fundo escuro com a cor da marca (impressora a cores).
 * mode "mono": preto sobre branco, pensado para impressoras térmicas.
 */
export default function Label(props) {
  return isVertical(props.size) ? <VerticalLabel {...props} /> : <HorizontalLabel {...props} />;
}

const mm = (n) => `${n}mm`;

/** Estilo do contorno da etiqueta (comum às duas orientações). */
function frameStyle({ w, h, mono, u }) {
  return {
    width: mm(w),
    height: mm(h),
    color: mono ? "#000" : "#fff",
    background: mono
      ? "#fff"
      : "linear-gradient(135deg, rgb(var(--brand-rgb) / 0) 0%, rgb(var(--brand-rgb) / 0.38) 100%), #15161b",
    border: mono ? `${mm(0.4)} solid #000` : "none",
    borderRadius: mm(2.5 * u),
    fontFamily: "Inter, system-ui, sans-serif",
    printColorAdjust: "exact",
    WebkitPrintColorAdjust: "exact",
    boxSizing: "border-box",
  };
}

function LogoMark({ workshop, mono, size }) {
  if (workshop.logo_url)
    return (
      <img
        src={workshop.logo_url}
        alt=""
        style={{
          width: mm(size),
          height: mm(size),
          objectFit: "contain",
          borderRadius: mm(size * 0.17),
          background: "#fff",
          filter: mono ? "grayscale(1) contrast(1.4)" : "none",
        }}
      />
    );
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: mm(size), height: mm(size), borderRadius: mm(size * 0.17), background: mono ? "#000" : "var(--brand)" }}
    >
      <Wrench color="#fff" style={{ width: mm(size * 0.57), height: mm(size * 0.57) }} />
    </div>
  );
}

/**
 * Etiqueta vertical (mais alta do que larga): marca no topo, matrícula,
 * QR centrado e próxima revisão em baixo. Medidas escaladas pela largura
 * (design base de 60×100 mm).
 */
function VerticalLabel({ vehicle, workshop, status, size, mode = "color", qrUrl }) {
  const qr = useQr(qrUrl || portalUrl(vehicle.public_token));
  const { w, h } = size;
  const mono = mode === "mono";
  // Escala pelo design base 60×100, limitada pela altura em etiquetas largas.
  const u = Math.min(w / 60, h / 100);
  const compact = w < 45 || h < 60;
  const pad = Math.max(2, 3.5 * u);
  const inner = w - pad * 2;
  const plateSize = Math.min(9 * u, inner / (Math.max(vehicle.plate.length, 6) * 0.72));
  // O QR ocupa a largura útil, sem passar de ~45% da altura.
  const qrBox = Math.min(inner, h * 0.45);
  const qrPad = 2 * u;
  const qrImg = qrBox - qrPad * 2;
  const sub = mono ? "#000" : "rgba(255,255,255,.75)";

  return (
    <div className="carmaintrack-label relative flex flex-col overflow-hidden" style={frameStyle({ w, h, mono, u })}>
      <div className="absolute inset-x-0 top-0" style={{ height: mm(1.6 * u), background: mono ? "#000" : "var(--brand)" }} />

      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-between text-center"
        style={{ padding: mm(pad), paddingTop: mm(pad + 1.2 * u) }}
      >
        <div className="flex w-full min-w-0 items-center justify-center" style={{ gap: mm(1.5 * u) }}>
          {!compact && <LogoMark workshop={workshop} mono={mono} size={7 * u} />}
          <div className="min-w-0 text-left leading-tight">
            <p className="truncate font-extrabold uppercase" style={{ fontSize: mm(Math.max(2.2, 2.9 * u)) }}>
              {workshop.name}
            </p>
            {!compact && (
              <p className="truncate" style={{ fontSize: mm(2 * u), color: sub }}>
                {workshop.tagline || "Histórico digital de revisões"}
              </p>
            )}
          </div>
        </div>

        <div className="w-full min-w-0">
          <p className="leading-none font-black whitespace-nowrap" style={{ fontSize: mm(plateSize), letterSpacing: "0.02em" }}>
            {vehicle.plate}
          </p>
          <p className="truncate" style={{ fontSize: mm(Math.max(2, 2.8 * u)), color: sub, marginTop: mm(0.8 * u) }}>
            {vehicleName(vehicle)}
          </p>
        </div>

        <div
          className="flex flex-col items-center justify-center bg-white"
          style={{
            width: mm(qrBox),
            height: mm(qrBox),
            borderRadius: mm(2 * u),
            padding: mm(qrPad),
            border: mono ? `${mm(0.3)} solid #000` : "none",
            boxSizing: "border-box",
          }}
        >
          {qr && <img src={qr} alt="QR" style={{ width: mm(qrImg), height: mm(qrImg), imageRendering: "pixelated" }} />}
        </div>

        {!compact && (
          <span
            className="rounded-full font-bold whitespace-nowrap uppercase"
            style={{
              fontSize: mm(2.3 * u),
              padding: `${mm(1 * u)} ${mm(3 * u)}`,
              background: mono ? "#000" : "var(--brand)",
              color: "#fff",
            }}
          >
            Leia · veja o histórico
          </span>
        )}

        <NextService status={status} size={Math.max(2.1, 2.7 * u)} compact={compact} align="center" sub={sub} />
      </div>
    </div>
  );
}

/** Etiqueta horizontal: texto à esquerda e QR à direita. */
function HorizontalLabel({ vehicle, workshop, status, size, mode = "color", qrUrl }) {
  const qr = useQr(qrUrl || portalUrl(vehicle.public_token));
  const { w, h } = size;
  const mono = mode === "mono";
  const compact = h < 40;
  // Unidade relativa ao design base de 100×60, limitada pela largura em
  // etiquetas quase quadradas (tamanhos personalizados).
  const u = Math.min(h / 60, w / 100);
  const pad = Math.max(2, 3.5 * u);
  // QR no máximo ~38% da largura, para sobrar espaço para a matrícula.
  const qrBox = Math.min(h - pad * 2, w * (compact ? 0.42 : 0.38));
  const textW = w - qrBox - pad * 3;
  // A matrícula ocupa a largura disponível sem ser cortada.
  const plateSize = Math.min(compact ? h * 0.24 : 9 * u, textW / (Math.max(vehicle.plate.length, 6) * 0.72));
  const qrPad = compact ? 1 : 2 * u;
  const qrImg = qrBox - qrPad * 2 - (compact ? 0 : 2.6 * u);
  const sub = mono ? "#000" : "rgba(255,255,255,.75)";
  // Os km e a data têm sempre de caber ao lado do QR: em etiquetas pequenas o
  // texto encolhe e, se preciso, perde o "Próx.:" (≈0,62 em por carácter).
  const nextSize = Math.min(compact ? 2.2 : Math.max(2.2, 2.6 * u), textW / (10 * 0.62));
  const nextPrefix = textW >= 16 * 0.62 * nextSize;

  return (
    <div className="carmaintrack-label relative flex overflow-hidden" style={frameStyle({ w, h, mono, u })}>
      {/* faixa superior */}
      <div className="absolute inset-x-0 top-0" style={{ height: mm(1.6 * u), background: mono ? "#000" : "var(--brand)" }} />

      <div
        className="label-text flex min-w-0 flex-1 flex-col justify-between"
        style={{ padding: mm(pad), paddingTop: mm(pad + 1.2 * u) }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: mm(1.5 * u) }}>
          {!compact && <LogoMark workshop={workshop} mono={mono} size={7 * u} />}
          <div className="min-w-0 leading-tight">
            <p className="truncate font-extrabold uppercase" style={{ fontSize: mm(Math.max(2.4, 2.9 * u)) }}>
              {workshop.name}
            </p>
            {!compact && (
              <p className="truncate" style={{ fontSize: mm(2 * u), color: sub }}>
                {workshop.tagline || "Histórico digital de revisões"}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p
            className="leading-none font-black whitespace-nowrap"
            style={{ fontSize: mm(plateSize), letterSpacing: "0.02em" }}
          >
            {vehicle.plate}
          </p>
          {!compact && (
            <p className="truncate" style={{ fontSize: mm(2.8 * u), color: sub, marginTop: mm(0.8 * u) }}>
              {vehicleName(vehicle)}
            </p>
          )}
        </div>

        {!compact && (
          <span
            className="self-start rounded-full font-bold whitespace-nowrap uppercase"
            style={{
              fontSize: mm(2.3 * u),
              padding: `${mm(1 * u)} ${mm(3 * u)}`,
              background: mono ? "#000" : "var(--brand)",
              color: "#fff",
            }}
          >
            Leia · veja o histórico
          </span>
        )}

        <NextService status={status} size={nextSize} compact={compact} sub={sub} prefix={nextPrefix} />
      </div>

      <div className="flex shrink-0 items-center" style={{ paddingRight: mm(pad) }}>
        <div
          className="flex flex-col items-center justify-center bg-white"
          style={{
            width: mm(qrBox),
            height: mm(qrBox),
            borderRadius: mm(2 * u),
            padding: mm(qrPad),
            border: mono ? `${mm(0.3)} solid #000` : "none",
            boxSizing: "border-box",
          }}
        >
          {qr && <img src={qr} alt="QR" style={{ width: mm(qrImg), height: mm(qrImg), imageRendering: "pixelated" }} />}
          {!compact && (
            <p className="font-bold text-black" style={{ fontSize: mm(1.8 * u), marginTop: mm(0.6 * u), letterSpacing: "0.2em" }}>
              SCAN
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
