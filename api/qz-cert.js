// GET /api/qz-cert -> certificado público usado pelo QZ Tray (impressão direta).
// Opcional: sem QZ_CERTIFICATE, devolve vazio e o QZ Tray pede autorização
// ao ligar. Com um certificado (e QZ_PRIVATE_KEY para assinar), os pedidos
// deixam de pedir confirmação. Ver README → Impressão direta.
import { env, handle } from "./_lib.js";

export const GET = handle(async () => {
  const cert = env("QZ_CERTIFICATE").replace(/\\n/g, "\n");
  return new Response(cert, { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
});
