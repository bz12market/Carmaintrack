import { useEffect, useState } from "react";
import { Camera, ImagePlus, Loader2, Star, Trash2, Images, Download } from "lucide-react";
import { useStore } from "../lib/store.js";
import { addPhoto, listPhotos, photoAsMainImage, removePhoto } from "../lib/db.js";
import { fmtDate } from "../lib/util.js";
import { Button, Modal } from "./ui.jsx";

/**
 * Fotografias da ficha do veículo: tirar com a câmara (telemóvel/tablet),
 * anexar ficheiros, ver em grande, usar como foto principal e apagar.
 */
export default function VehiclePhotos({ vehicle }) {
  const { data, save } = useStore();
  const [photos, setPhotos] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let alive = true;
    listPhotos(vehicle.id)
      .then((list) => alive && setPhotos(list))
      .catch((e) => alive && (setPhotos([]), setErr(e.message || String(e))));
    return () => {
      alive = false;
    };
  }, [vehicle.id]);

  async function upload(e) {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;
    setErr("");
    for (const [i, file] of files.entries()) {
      setBusy(files.length > 1 ? `A guardar fotografia ${i + 1} de ${files.length}…` : "A guardar a fotografia…");
      try {
        const photo = await addPhoto(vehicle, data.workshop.id, file);
        setPhotos((list) => [...(list || []), photo]);
      } catch (e2) {
        setErr(e2.message || String(e2));
        break;
      }
    }
    setBusy("");
  }

  async function makeMain(photo) {
    setBusy("A definir a foto principal…");
    try {
      await save("vehicles", { ...vehicle, photo_url: await photoAsMainImage(photo) });
      setOpen(null);
    } catch (e2) {
      setErr(e2.message || String(e2));
    }
    setBusy("");
  }

  async function del(photo) {
    if (!confirm("Apagar esta fotografia?")) return;
    try {
      await removePhoto(photo);
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      setOpen(null);
    } catch (e2) {
      setErr(e2.message || String(e2));
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
          Fotografias{photos ? ` · ${photos.length}` : ""}
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* No telemóvel, "capture" abre logo a câmara traseira. */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand hover:brightness-110">
            <Camera size={16} /> Tirar fotografia
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={upload} disabled={!!busy} />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-ink/5 px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-ink/10">
            <ImagePlus size={16} /> Anexar fotografias
            <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={!!busy} />
          </label>
        </div>
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> {busy}
        </p>
      )}
      {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}

      {photos === null ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> A carregar…
        </p>
      ) : photos.length === 0 ? (
        <div className="card flex flex-col items-center gap-1 px-6 py-8 text-center text-sm text-muted">
          <Images size={28} className="text-subtle" />
          Sem fotografias. Tire uma com a câmara ou anexe ficheiros (estado da viatura, danos, peças, documentos…).
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpen(p)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-field"
            >
              <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <Modal title={`Fotografia de ${fmtDate(open.created_at)}`} onClose={() => setOpen(null)} wide>
          <img src={open.url} alt="" className="max-h-[60dvh] w-full rounded-xl bg-black object-contain" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => makeMain(open)} disabled={!!busy}>
              <Star size={16} /> Usar como foto principal
            </Button>
            <Button variant="ghost" href={open.url} download={`${vehicle.plate}-${open.id}.jpg`}>
              <Download size={16} /> Descarregar
            </Button>
            <div className="flex-1" />
            <Button variant="danger" onClick={() => del(open)}>
              <Trash2 size={16} /> Apagar
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">A foto principal aparece na ficha, nas listas e no portal do cliente.</p>
        </Modal>
      )}
    </section>
  );
}
