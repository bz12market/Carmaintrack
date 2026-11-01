// Impressão direta na impressora de etiquetas, sem a janela de impressão do
// browser. Usa o QZ Tray (https://qz.io), um programa gratuito instalado no
// computador da oficina que recebe os pedidos da app e os envia para a
// impressora escolhida. A configuração é por computador (localStorage).
import { toPng } from "html-to-image";
import { api } from "./db.js";

const KEY = "carmaintrack-print";
const DEFAULTS = { enabled: false, printer: "", dpi: 203 };

export function readPrintPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return DEFAULTS;
  }
}

export function savePrintPrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignora */
  }
}

/** A impressão direta está ligada e tem impressora escolhida. */
export const directPrintReady = (prefs = readPrintPrefs()) => prefs.enabled && !!prefs.printer;

let qzLoaded = null;

async function loadQz() {
  // Nos testes automáticos é injetado um QZ simulado.
  if (typeof window !== "undefined" && window.__carmaintrackQz) return window.__carmaintrackQz;
  if (!qzLoaded)
    qzLoaded = import("qz-tray").then(({ default: qz }) => {
      // Certificado e assinatura vêm do servidor (api/qz-cert e api/qz-sign).
      // Sem certificado configurado, o QZ Tray pede autorização ao ligar.
      qz.security.setCertificatePromise((resolve) =>
        fetch("/api/qz-cert")
          .then((r) => (r.ok ? r.text() : ""))
          .then(resolve, () => resolve(""))
      );
      qz.security.setSignatureAlgorithm("SHA512");
      qz.security.setSignaturePromise((toSign) => (resolve) =>
        api("qz-sign", { request: toSign })
          .then((r) => resolve(r.signature || ""))
          .catch(() => resolve(""))
      );
      return qz;
    });
  return qzLoaded;
}

/** Liga ao QZ Tray (se ainda não estiver ligado) e devolve o objeto qz. */
export async function connectQz() {
  const qz = await loadQz();
  if (!qz.websocket.isActive()) {
    try {
      await qz.websocket.connect({ retries: 1, delay: 1 });
    } catch {
      throw new Error(
        "Não foi possível ligar ao QZ Tray. Confirme que está instalado e aberto neste computador (ícone junto ao relógio)."
      );
    }
  }
  return qz;
}

export async function listPrinters() {
  const qz = await connectQz();
  const found = await qz.printers.find();
  return Array.isArray(found) ? found : [found].filter(Boolean);
}

/** Converte etiquetas já desenhadas na página em imagens PNG (base64) à resolução da impressora. */
export async function labelsToImages(nodes, dpi) {
  const images = [];
  for (const node of nodes) {
    const url = await toPng(node, { pixelRatio: dpi / 96, backgroundColor: "#ffffff", skipFonts: true, cacheBust: false });
    images.push(url.slice(url.indexOf(",") + 1));
  }
  return images;
}

/** Espera que os QR das etiquetas estejam desenhados (são gerados de forma assíncrona). */
export async function waitForLabels(container, timeout = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const labels = [...container.querySelectorAll(".carmaintrack-label")];
    const ready =
      labels.length > 0 &&
      labels.every((l) => {
        const img = l.querySelector('img[alt="QR"]');
        return img && img.complete && img.naturalWidth > 0;
      });
    if (ready) return labels;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("As etiquetas não ficaram prontas a tempo. Tente de novo.");
}

/**
 * Envia as etiquetas (nós .carmaintrack-label) diretamente para a impressora
 * configurada. Cada etiqueta é uma página do tamanho exato da etiqueta.
 */
export async function printLabelsDirect(nodes, { size, mode, copies = 1 }) {
  const prefs = readPrintPrefs();
  if (!prefs.printer) throw new Error("Escolha a impressora de etiquetas em Personalizar → Impressão direta.");
  const qz = await connectQz();
  const images = await labelsToImages(nodes, prefs.dpi);
  const config = qz.configs.create(prefs.printer, {
    size: { width: size.w, height: size.h },
    units: "mm",
    margins: 0,
    scaleContent: true,
    rasterize: true,
    colorType: mode === "mono" ? "blackwhite" : "color",
    copies,
    jobName: "Carmaintrack - etiquetas",
  });
  await qz.print(
    config,
    images.map((data) => ({ type: "pixel", format: "image", flavor: "base64", data }))
  );
  return { printer: prefs.printer, count: images.length * copies };
}
