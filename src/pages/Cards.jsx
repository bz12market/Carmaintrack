import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer, Download, Search } from "lucide-react";
import { useStore } from "../lib/store.js";
import { portalUrl, vehicleName } from "../lib/util.js";
import { Button, Empty, Plate } from "../components/ui.jsx";
import { Logo } from "../components/Layout.jsx";

function useQr(text) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: "M" }).then(setSrc);
  }, [text]);
  return src;
}

/** Cartão para entregar ao cliente (formato cartão de visita, 85×55 mm). */
function VehicleCard({ vehicle, workshop }) {
  const qr = useQr(portalUrl(vehicle.public_token));
  return (
    <div
      className="flex overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg print:rounded-none print:shadow-none print:outline print:outline-1 print:outline-slate-300"
      style={{ width: "85mm", height: "55mm" }}
    >
      <div className="flex flex-1 flex-col justify-between p-[4mm]">
        <div className="flex items-center gap-2">
          <Logo workshop={workshop} size={28} />
          <p className="text-[11px] leading-tight font-bold">{workshop.name}</p>
        </div>
        <div>
          <p className="text-[8px] font-semibold tracking-wider text-slate-500 uppercase">Histórico digital</p>
          <Plate className="text-lg leading-none">{vehicle.plate}</Plate>
          <p className="truncate text-[9px] text-slate-600">{vehicleName(vehicle)}</p>
        </div>
        <p className="text-[8px] leading-tight text-slate-500">
          Aponte a câmara ao código para ver as revisões e a próxima visita.
          {workshop.phone && <span className="block font-semibold text-slate-700">{workshop.phone}</span>}
        </p>
      </div>
      <div className="flex w-[36mm] items-center justify-center" style={{ background: "var(--brand)" }}>
        {qr && <img src={qr} alt="QR" className="h-[30mm] w-[30mm] rounded-md bg-white p-[1mm]" />}
      </div>
    </div>
  );
}

export default function Cards() {
  const { data, clientOf } = useStore();
  const initial = new URLSearchParams(window.location.search).get("v");
  const [selected, setSelected] = useState(() => new Set(initial ? [initial] : []));
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase().replace(/-/g, "");
  const list = [...data.vehicles]
    .sort((a, b) => a.plate.localeCompare(b.plate))
    .filter(
      (v) =>
        !needle ||
        [v.plate.replace(/-/g, ""), v.make, v.model, clientOf(v)?.name]
          .filter(Boolean)
          .some((t) => t.toLowerCase().includes(needle))
    );
  const chosen = data.vehicles.filter((v) => selected.has(v.id));

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function download(v) {
    const url = await QRCode.toDataURL(portalUrl(v.public_token), { margin: 2, width: 1024 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${v.plate}.png`;
    a.click();
  }

  if (data.vehicles.length === 0) return <Empty title="Ainda não há veículos" />;

  return (
    <div className="space-y-6">
      <div className="no-print space-y-3">
        <p className="text-sm text-slate-400">
          Cada veículo tem um código QR único que abre o seu histórico digital. Imprima cartões para entregar ao cliente
          ou colar no para-brisas/porta-luvas, em vez do autocolante de papel.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" size={18} />
            <input className="input pl-10" placeholder="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => window.print()} disabled={chosen.length === 0}>
            <Printer size={16} /> Imprimir {chosen.length || ""} cartão{chosen.length === 1 ? "" : "s"}
          </Button>
        </div>
        <div className="card divide-y divide-white/5">
          {list.map((v) => (
            <label key={v.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03]">
              <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} className="accent-[var(--brand)]" />
              <Plate className="text-white">{v.plate}</Plate>
              <span className="flex-1 truncate text-sm text-slate-400">
                {vehicleName(v)} · {clientOf(v)?.name || "—"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  download(v);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
                title="Descarregar QR (PNG)"
              >
                <Download size={16} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {chosen.length > 0 && (
        <div>
          <h2 className="no-print mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">Pré-visualização</h2>
          <div className="flex flex-wrap gap-4 print:gap-[4mm]">
            {chosen.map((v) => (
              <VehicleCard key={v.id} vehicle={v} workshop={data.workshop} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
