// POST /api/plate-lookup { plate } -> { found, make, model, engine, fuel, year, description }
// Identifica o veículo pela matrícula portuguesa através do serviço RegCheck
// (matricula.co.pt, endpoint CheckPortugal; conta em PLATE_API_USERNAME).
// Os resultados ficam em cache na tabela plate_lookups, para não pagar duas
// vezes a mesma matrícula. Só para contas com sessão iniciada.
import { HttpError, env, getAdmin, handle, json, readJson, userFromRequest } from "./_lib.js";

const PT_PLATE = /^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;
const CACHE_DAYS = 180;

/** "aa 00 bb", "AA00BB" -> "AA-00-BB" (ou "" se não for uma matrícula portuguesa). */
export function normalizePtPlate(raw) {
  const clean = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length !== 6) return "";
  const plate = `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`;
  return PT_PLATE.test(plate) ? plate : "";
}

const text = (v) => (v && typeof v === "object" ? v.CurrentTextValue ?? v.CurrentValue ?? "" : v ?? "");
const decodeXml = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const titleCase = (s) => String(s).toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

/** Converte a resposta XML do RegCheck nos campos da app. */
export function parseRegCheck(xml) {
  const m = String(xml).match(/<vehicleJson>([\s\S]*?)<\/vehicleJson>/);
  if (!m) return { found: false };
  let v;
  try {
    v = JSON.parse(decodeXml(m[1]));
  } catch {
    return { found: false };
  }
  const make = text(v.CarMake) || text(v.MakeDescription);
  const model = text(v.CarModel) || text(v.ModelDescription);
  if (!make && !v.Description) return { found: false };
  const cc = parseInt(text(v.EngineSize), 10);
  const fuel = text(v.FuelType);
  const engine = [cc > 0 ? `${(cc / 1000).toFixed(1)}` : "", fuel].filter(Boolean).join(" ");
  const year = parseInt(v.RegistrationYear || text(v.RegistrationYear), 10);
  return {
    found: true,
    make: make ? titleCase(make) : "",
    model: model ? titleCase(model) : "",
    engine,
    fuel,
    year: year > 1900 ? year : null,
    description: v.Description || "",
  };
}

async function fromRegCheck(plate) {
  const username = env("PLATE_API_USERNAME");
  if (!username) throw new HttpError(501, "A identificação pela matrícula não está configurada.");
  const url = `https://www.regcheck.org.uk/api/reg.asmx/CheckPortugal?RegistrationNumber=${encodeURIComponent(
    plate
  )}&username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const body = await res.text();
  // O RegCheck responde com erro (500) quando não encontra a matrícula ou acabaram os créditos.
  if (!res.ok) {
    if (/credit/i.test(body)) throw new HttpError(402, "Acabaram os créditos do serviço de matrículas.");
    return { found: false };
  }
  return parseRegCheck(body);
}

export const POST = handle(async (request) => {
  await userFromRequest(request);
  const { plate: raw } = await readJson(request);
  const plate = normalizePtPlate(raw);
  if (!plate) throw new HttpError(400, "Matrícula inválida (formato AA-00-AA).");

  const admin = getAdmin();
  const { data: cached } = await admin.from("plate_lookups").select("data, fetched_at").eq("plate", plate).maybeSingle();
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_DAYS * 86400000)
    return json(200, { plate, ...cached.data, cached: true });

  const data = await fromRegCheck(plate);
  // Só guarda em cache o que foi encontrado (uma matrícula nova pode aparecer mais tarde).
  if (data.found)
    await admin.from("plate_lookups").upsert({ plate, data, fetched_at: new Date().toISOString() }, { onConflict: "plate" });
  return json(200, { plate, ...data });
});
