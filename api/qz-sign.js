// POST /api/qz-sign { request } -> { signature } para o QZ Tray.
// Só assina para contas com sessão iniciada, com a chave privada que
// corresponde a QZ_CERTIFICATE. Sem chave configurada devolve assinatura
// vazia (o QZ Tray pede então autorização ao ligar).
import { createSign } from "node:crypto";
import { HttpError, env, handle, json, readJson, userFromRequest } from "./_lib.js";

export const POST = handle(async (request) => {
  const key = env("QZ_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!key) return json(200, { signature: "" });
  await userFromRequest(request);
  const { request: toSign } = await readJson(request);
  if (typeof toSign !== "string" || !toSign || toSign.length > 10000) throw new HttpError(400, "Pedido inválido.");
  const signature = createSign("RSA-SHA512").update(toSign).sign(key, "base64");
  return json(200, { signature });
});
