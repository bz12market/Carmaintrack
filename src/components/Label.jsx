import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Wrench } from "lucide-react";
import { fmtDate, fmtKm, portalUrl, vehicleName } from "../lib/util.js";

// Tamanhos de etiqueta mais comuns. As térmicas de 4" (100 mm) usam rolos
// 100×50 / 100×60; as Brother QL usam 62 mm; as portáteis (Niimbot) 50×30.
export const LABEL_SIZES = [
  { id: "100x60", name: "100 × 60 mm", w: 100, h: 60, hint: "Térmica 4\" (recomendado)" },
  { id: "100x50", name: "100 × 50 mm", w: 100, h: 50, hint: "Térmica 4\"" },
  { id: "85x55", name: "85 × 55 mm", w: 85, h: 55, hint: "Cartão de visita" },
  { id: "62x29", name: "62 × 29 mm", w: 62, h: 29, hint: "Brother QL (62 mm)" },
  { id: "50x30", name: "50 × 30 mm", w: 50, h: 30, hint: "Portátil (Niimbot e similares)" },
];

export function useQr(text) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 0, width: 480, errorCorrectionLevel: "M" }).then(setSrc);
  }, [text]);
  return src;
}

export function nextLine(st) {
  const parts = [st?.nextKm != null && fmtKm(st.nextKm), st?.nextDate && fmtDate(st.nextDate)].filter(Boolean);
  return parts.length ? `Próxima: ${parts.join(" ou ")}` : "";
}

/**
 * Etiqueta autocolante para o para-brisas (ou cartão).
 * mode "color": fundo escuro com a cor da marca (impressora a cores).
 * mode "mono": preto sobre branco, pensado para impressoras térmicas.
 * Todas as medidas em mm, escaladas pela altura da etiqueta.
 */
export default function Label({ vehicle, workshop, status, size, mode = "color", qrUrl }) {
  const qr = useQr(qrUrl || portalUrl(vehicle.public_token));
  const { w, h } = size;
  const mono = mode === "mono";
  const compact = h < 40;
  const u = h / 60; // unidade relativa ao design base de 100×60
  const pad = Math.max(2, 3.5 * u);
  // QR no máximo ~38% da largura, para sobrar espaço para a matrícula.
  const qrBox = Math.min(h - pad * 2, w * (compact ? 0.42 : 0.38));
  const textW = w - qrBox - pad * 3;
  // A matrícula ocupa a largura disponível sem ser cortada.
  const plateSize = Math.min(compact ? h * 0.24 : 9 * u, textW / (Math.max(vehicle.plate.length, 6) * 0.72));
  const qrPad = compact ? 1 : 2 * u;
  const qrImg = qrBox - qrPad * 2 - (compact ? 0 : 2.6 * u);
  const fg = mono ? "#000" : "#fff";
  const sub = mono ? "#000" : "rgba(255,255,255,.75)";
  const next = nextLine(status);

  const mm = (n) => `${n}mm`;

  return (
    <div
      className="carmaintrack-label relative flex overflow-hidden"
      style={{
        width: mm(w),
        height: mm(h),
        color: fg,
        background: mono
          ? "#fff"
          : "linear-gradient(135deg, #15161b 0%, color-mix(in srgb, var(--brand) 38%, #15161b) 100%)",
        border: mono ? `${mm(0.4)} solid #000` : "none",
        borderRadius: mm(2.5 * u),
        fontFamily: "Inter, system-ui, sans-serif",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
        boxSizing: "border-box",
      }}
    >
      {/* faixa superior */}
      <div className="absolute inset-x-0 top-0" style={{ height: mm(1.6 * u), background: mono ? "#000" : "var(--brand)" }} />

      <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ padding: mm(pad), paddingTop: mm(pad + 1.2 * u) }}>
        <div className="flex min-w-0 items-center" style={{ gap: mm(1.5 * u) }}>
          {!compact &&
            (workshop.logo_url ? (
              <img
                src={workshop.logo_url}
                alt=""
                style={{
                  width: mm(7 * u),
                  height: mm(7 * u),
                  objectFit: "contain",
                  borderRadius: mm(1.2 * u),
                  background: "#fff",
                  filter: mono ? "grayscale(1) contrast(1.4)" : "none",
                }}
              />
            ) : (
              <div
                className="flex shrink-0 items-center justify-center"
                style={{ width: mm(7 * u), height: mm(7 * u), borderRadius: mm(1.2 * u), background: mono ? "#000" : "var(--brand)" }}
              >
                <Wrench color="#fff" style={{ width: mm(4 * u), height: mm(4 * u) }} />
              </div>
            ))}
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

        <p className="leading-tight font-semibold" style={{ fontSize: mm(compact ? 2.3 : Math.max(2.2, 2.5 * u)) }}>
          {next || "Leia o código para ver o histórico"}
        </p>
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
