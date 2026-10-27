// POST /api/register
//   { session_id, action: "info" }                 -> { email, hasAccount, registered }
//   { session_id, password, workshop_name? }       -> cria a conta e associa a subscrição
//
// Só aceita sessões de checkout do Stripe concluídas com uma subscrição ativa:
// é isto que garante que não há registo sem subscrição. O session_id só é
// conhecido de quem pagou (vem no URL de regresso do Stripe).
//
// O webhook também cria a conta (por convite, com email) quando o checkout
// termina; enquanto ninguém tiver entrado nessa conta, esta página continua a
// poder definir a palavra-passe ("pending").
import { HttpError, findUserByEmail, getAdmin, handle, json, readJson } from "./_lib.js";
import { accountFor, alreadyExists, ensureWorkshop, isUnusedInvite, linkSubscription, paidSession } from "./_account.js";

function readPassword(body) {
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) throw new HttpError(400, "A palavra-passe tem de ter pelo menos 8 caracteres.");
  return password;
}

/** Define a palavra-passe numa conta criada por convite e confirma o email. */
async function activateInvited(user, password) {
  const { error } = await getAdmin().auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
}

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const admin = getAdmin();
  const { sub, email } = await paidSession(body.session_id);
  const { registered, user, pending } = await accountFor(sub, email);

  if (body.action === "info") {
    return json(200, {
      email,
      hasAccount: !!user && !pending,
      registered: !!registered && !pending,
    });
  }

  if (registered && !pending) throw new HttpError(409, "Esta subscrição já tem conta. Entre com o seu email e palavra-passe.");

  // Conta criada pelo webhook (convite) e ainda por usar: define a palavra-passe aqui.
  if (pending) {
    await activateInvited(user, readPassword(body));
    if (!registered) await linkSubscription(user.id, sub);
    await ensureWorkshop(user.id, body.workshop_name);
    return json(200, { email });
  }

  // Quem já tem conta (p.ex. renovou depois de cancelar) fica com a subscrição
  // associada à conta existente; a palavra-passe dessa conta não é alterada.
  if (user) {
    await linkSubscription(user.id, sub);
    return json(200, { email, existed: true });
  }

  const password = readPassword(body);
  let userId;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    // O webhook criou a conta por convite entre a leitura e agora.
    const invited = alreadyExists(error) ? await findUserByEmail(admin, email) : null;
    if (!invited || !isUnusedInvite(invited)) throw error;
    await activateInvited(invited, password);
    userId = invited.id;
  } else {
    userId = data.user.id;
  }

  await linkSubscription(userId, sub);
  await ensureWorkshop(userId, body.workshop_name);
  return json(200, { email, existed: false });
});
