# Carmaintrack

Histórico digital e lembretes de revisão para oficinas e centros de mudança
de óleo, vendido por subscrição mensal. Feita com Vite, React, Tailwind,
Supabase e Stripe, publicada na Vercel.

## Páginas

| Endereço | O que é |
|---|---|
| `/` | Landing page com a apresentação e os preços |
| `/demo` | Demonstração com dados fictícios e um guia de 5 passos (sem login). Os dados ficam só no browser, recomeçam a cada visita (sair e voltar, ou separador novo) e apagam-se ao fim de 48 h; podem acrescentar-se 3 veículos (e 3 clientes) e 5 revisões aos exemplos (`DEMO_EXTRA` em `src/lib/db.js`) |
| `/entrar` | Login das oficinas, com "Esqueci-me da palavra-passe" |
| `/registo` | Página de regresso do pagamento, onde se cria a conta |
| `/app` | Painel da oficina (login **e** subscrição ativa) |
| `/v/<código>` | Portal público do cliente (o QR das etiquetas) |

## Subscrições: como funciona

1. Na landing page, a oficina escolhe o plano e paga no **Stripe Checkout**
   (cartão ou débito direto SEPA; pode ter dias experimentais).
2. O Stripe volta a `/registo?session_id=...`. O servidor (`api/register.js`)
   confirma que o pagamento está concluído e que a subscrição está ativa, e
   só então cria a conta com o email usado no pagamento. A pessoa escolhe a
   palavra-passe e entra logo.
   Ao mesmo tempo, o webhook (`checkout.session.completed`) garante a conta:
   se ainda não existir, cria-a por convite e o Supabase envia o email de
   boas-vindas com o link para definir a palavra-passe. Assim, quem fechar o
   browser depois de pagar não perde o acesso. Enquanto ninguém entrar nessa
   conta, a página de registo continua a poder definir a palavra-passe.
3. Não há outra forma de criar conta: o login não tem "Criar conta" e o
   registo público do Supabase deve ficar desligado (ver abaixo).
4. O Stripe avisa `api/stripe-webhook.js` de renovações, falhas de pagamento
   e cancelamentos, e a tabela `subscriptions` é atualizada.
5. Sem subscrição ativa, a própria base de dados (RLS) recusa o acesso aos
   dados e o portal dos clientes deixa de mostrar o histórico. Os dados não
   são apagados. Com `past_due` (pagamento em atraso) o acesso mantém-se
   enquanto o Stripe tenta cobrar de novo.
6. Em **Personalizar → Subscrição**, a oficina abre o portal de faturação do
   Stripe para ver faturas, trocar o cartão ou cancelar.
7. Quem cancelou e volta a pagar com o mesmo email recupera a conta e os dados.

Planos: **mensal a 11,98 € + IVA** e **anual a 115 € + IVA** (20% de
desconto face a 12 × 11,98 € = 143,76 €), ambos com 14 dias grátis. Os textos
mostrados estão em `src/config/plans.js`; o valor cobrado é o do preço criado
no Stripe, sem IVA, e o IVA é acrescentado pela taxa `STRIPE_TAX_RATE_ID`.
Para desligar um plano, muda `enabled` para `false`.

## O que faz

**Painel da oficina** (login com email/palavra-passe):

- **Início**: tem uma pesquisa rápida por matrícula, cliente ou modelo. Mostra
  os contadores de veículos em dia, a vencer e atrasados, e os alertas dos
  veículos sem WhatsApp. Também lista os últimos serviços.
- **Clientes**: lista com pesquisa (nome, telefone, email ou matrícula),
  "Novo cliente" e uma ficha por cliente com os dados (editáveis), os seus
  veículos, "Adicionar veículo" (já com o cliente escolhido), WhatsApp,
  ligar e eliminar (os veículos ficam, sem proprietário).
- **Veículos**: lista com filtros por estado e "Novo veículo". Cada ficha tem:
  - proprietário (abre a ficha do cliente) e quilometragem;
  - próxima revisão;
  - **fotografias**: "Tirar fotografia" (abre a câmara no telemóvel/tablet)
    e "Anexar fotografias" (vários ficheiros), ver em grande, descarregar,
    usar como foto principal (a do portal do cliente) e apagar;
  - histórico em timeline;
  - botões para enviar por WhatsApp, abrir o portal, copiar o link, imprimir
    a etiqueta, ligar e editar.
- **Identificação pela matrícula**: ao escrever uma matrícula completa no
  registo de um veículo, a app preenche a marca, o modelo/motor e o ano; o
  utilizador confirma ("Está correto") ou corrige antes de gravar. Usa o
  serviço RegCheck (`api/plate-lookup.js`, ver configuração abaixo), com cache
  na tabela `plate_lookups`; na demonstração os dados são de exemplo.
- **Registar revisão**: tipo de serviço, data, km, óleo (com sugestões dos
  óleos já usados), filtros, serviços adicionais e observações. A próxima
  revisão é calculada automaticamente (por km e por data, vence o que chegar
  primeiro) e pode ser editada à mão. A quilometragem do veículo é atualizada.
- **Lembretes**: mostra os veículos atrasados ou dentro do prazo de aviso. O
  botão abre o WhatsApp do cliente com a mensagem já escrita e o link do
  histórico, e marca o lembrete como enviado.
- **Etiquetas e QR**: cada veículo tem um código QR único. A etiqueta para
  colar no interior do para-brisas, no lugar do autocolante de papel da
  mudança de óleo, tem:
  - o logótipo e o nome da oficina;
  - a matrícula e o modelo;
  - "Leia · veja o histórico" e a próxima revisão em km e data;
  - o QR.

  Depois de registar uma revisão, a ficha do veículo sugere logo "Imprimir
  etiqueta". Opções disponíveis, guardadas por computador:
  - **Tipo de impressora**: *Térmica* (preto e branco, sem fundos escuros,
    porque as térmicas só imprimem a preto) ou *A cores*.
  - **Papel**: *Rolo de etiquetas* (uma página por etiqueta, com o tamanho
    exato) ou *Folha A4 de autocolantes*.
  - **Tamanho**, na horizontal: 100×60 e 100×50 mm (térmicas de 4"),
    85×55 mm (cartão), 62×29 mm (Brother QL) e 50×30 mm (portáteis, tipo
    Niimbot); na vertical: 60×100 e 50×80 mm (térmicas), 62×100 mm (Brother
    QL), 55×85 mm (cartão) e 40×60 mm (portáteis). As verticais têm a marca
    no topo, a matrícula, o QR ao centro e a próxima revisão em baixo.
    Em **Personalizar → Tamanhos de etiqueta** acrescentam-se tamanhos
    personalizados (largura × altura em mm, mínimo 25 × 35 mm), guardados na
    oficina (`workshops.label_sizes`) e mostrados no grupo "Personalizados".
  - **Cópias** por veículo, e descarregar só o QR em PNG.

  Todas as etiquetas mostram os **quilómetros e a data** da próxima revisão
  ("—" se faltar algum); nas pequenas o texto encolhe para caber ao lado do QR.

  **Impressão direta (sem janela de impressão):** os browsers não deixam um
  site imprimir sem mostrar a janela de impressão, por isso a app usa o
  [QZ Tray](https://qz.io/download/), um programa gratuito instalado no
  computador da oficina. Em **Personalizar → Impressão direta** procura-se a
  impressora, escolhe-se a resolução (203/300/600 dpi) e liga-se "Imprimir
  diretamente" (fica guardado nesse computador). A partir daí, "Imprimir" (e o
  "Imprimir etiqueta" da ficha do veículo) converte cada etiqueta numa imagem
  do tamanho exato e envia-a para a impressora (só em "Rolo de etiquetas").
  Alternativa sem instalar nada: abrir o Chrome com `--kiosk-printing`, que
  imprime sem janela na impressora predefinida.

  Sem impressão direta, na janela de impressão escolhe a impressora e o papel
  com o mesmo tamanho, margens "Nenhuma", escala 100% e desativa "Cabeçalhos
  e rodapés".
- **Personalizar**: logótipo, nome, slogan, telefone, WhatsApp e morada;
  intervalo padrão de revisão (km/meses) e limites de aviso (km/dias); estado
  da subscrição.
- **Cores**, também em Personalizar: 7 paletas predefinidas (Petróleo,
  Oceano, Ameixa e Areia, claras; Grafite, Floresta e Meia-noite, escuras) ou
  uma paleta personalizada (modo claro/escuro, cor principal, cor secundária,
  fundo, cartões e texto), com pré-visualização imediata e aviso de pouco
  contraste. A paleta fica guardada na oficina e aplica-se ao painel, ao
  portal do cliente e às etiquetas a cores.

**Portal do cliente** (`/v/<código>`): é público, não precisa de login nem de
instalar nada, e mostra a marca da oficina. Inclui:

- matrícula, modelo, proprietário e quilometragem;
- estado (em dia / a vencer / atrasado);
- último óleo usado, filtros e próxima revisão;
- aviso com o botão "Pedir marcação" (WhatsApp);
- histórico completo em timeline;
- botões fixos "Enviar mensagem" e "Ligar".

O link de cada veículo usa um código aleatório de 96 bits e não é
adivinhável. O portal só recebe os dados desse veículo, através da função
`public_vehicle` no Supabase.

## Experimentar no computador

```bash
npm install
npm run dev
```

Abre http://localhost:5174 (landing) ou http://localhost:5174/demo. Sem um
ficheiro `.env`, o painel em `/app` também abre com dados de exemplo.

As funções de pagamento (`/api/...`) só correm com a Vercel CLI:
`npx vercel dev` (com as variáveis abaixo num `.env`).

## Configuração em produção

### Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Onde a encontrar |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (**secreta**) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → o teu endpoint → Signing secret |
| `STRIPE_PRICE_MENSAL` | Stripe → Product catalog → o produto → o preço mensal (`price_...`) |
| `STRIPE_PRICE_ANUAL` | o preço anual (`price_...`) |
| `STRIPE_TAX_RATE_ID` | Stripe → Product catalog → Tax rates → IVA 23% (`txr_...`) |
| `APP_URL` | (opcional) o endereço público, se usares domínio próprio |
| `PLATE_API_USERNAME` | (opcional) utilizador do serviço de matrículas RegCheck ([matricula.co.pt](https://www.matricula.co.pt)); sem ele, a marca e o modelo preenchem-se à mão |
| `QZ_CERTIFICATE` / `QZ_PRIVATE_KEY` | (opcional) certificado e chave privada (PEM) para o QZ Tray não pedir autorização; ver abaixo |

Depois de mudar variáveis, faz **Redeploy** da produção.

### Supabase

1. Em **SQL Editor**, corre `supabase/schema.sql` (pode ser corrido de novo
   sobre uma instalação anterior: só acrescenta o que falta).
2. Em **Authentication → Sign In / Providers**, desliga **Allow new users to
   sign up**. As contas passam a ser criadas só pelo servidor, depois do
   pagamento.
3. Em **Authentication → URL Configuration**, define o **Site URL** e junta
   `<endereço>/**` em **Redirect URLs** (usado nos emails de boas-vindas e
   de recuperação da palavra-passe).
4. Em **Authentication → Emails → Templates**, cola os modelos em português
   de `supabase/email-templates/`:
   - **Invite user**: assunto "Bem-vindo ao Carmaintrack: defina a sua
     palavra-passe", corpo `convite.html`;
   - **Reset password**: assunto "Carmaintrack: nova palavra-passe", corpo
     `recuperar-palavra-passe.html`.
5. Em **Authentication → Emails → SMTP Settings**, liga um serviço de envio
   (Brevo, Resend, ...). O envio incluído no Supabase só serve para testes:
   envia muito poucos emails por hora.

Para dar acesso sem pagamento (a tua própria conta, ou uma oficina de
teste), corre no SQL Editor:

```sql
insert into subscriptions (user_id, status)
select id, 'active' from auth.users where email = 'email@exemplo.pt'
on conflict (user_id) do update set status = 'active';
```

### Stripe

1. **Product catalog → Add product**: "Carmaintrack", com dois preços
   recorrentes em EUR, **sem IVA**: 11,98 € **mensal** e 115,00 € **anual**.
   Copia o id de cada preço (`price_...`).
2. **Product catalog → Tax rates → New**: "IVA", 23%, Portugal, tipo
   **Exclusive** (o IVA soma-se ao preço). Copia o id (`txr_...`).
3. **Developers → Webhooks → Add endpoint**:
   `https://<endereço>/api/stripe-webhook`, com os eventos
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated` e `customer.subscription.deleted`. Copia o
   **Signing secret**. (No painel novo do Stripe: Workbench → Webhooks →
   Add destination.)
4. **Settings → Billing → Customer portal**: ativa o portal (cancelar
   subscrição, atualizar método de pagamento, ver faturas).
5. **Settings → Payment methods**: ativa os métodos que queres aceitar
   (cartão e débito direto SEPA funcionam com subscrições).
6. Testa primeiro em **modo de teste** (chaves `sk_test_...`, cartão
   `4242 4242 4242 4242`) e só depois muda para as chaves reais.

### Fotografias (Supabase Storage)

O `schema.sql` cria o bucket privado `vehicle-photos` e as políticas: cada
oficina só lê e escreve na sua pasta (`<workshop_id>/...`) e só com
subscrição ativa. As fotografias são reduzidas a 1600 px antes de enviar. O
plano gratuito do Supabase inclui 1 GB de armazenamento (~3000-5000 fotos).

### Identificação pela matrícula (opcional)

1. Cria uma conta em [matricula.co.pt](https://www.matricula.co.pt) (serviço
   RegCheck, endpoint `CheckPortugal`) e compra créditos (cada matrícula nova
   gasta um crédito; as repetidas vêm da cache durante 180 dias).
2. Na Vercel, define `PLATE_API_USERNAME` com o teu utilizador e faz Redeploy.

### QZ Tray sem pedidos de autorização (opcional)

Sem certificado, o QZ Tray pergunta "Allow" quando a app se liga a ele (uma vez
por sessão). Para deixar de perguntar:

1. Gera um certificado e uma chave, por exemplo:
   `openssl req -x509 -newkey rsa:2048 -keyout chave.pem -out certificado.pem -days 3650 -nodes -subj "/CN=Carmaintrack"`
2. Na Vercel, define `QZ_CERTIFICATE` (conteúdo de `certificado.pem`) e
   `QZ_PRIVATE_KEY` (conteúdo de `chave.pem`) e faz Redeploy. A assinatura só
   é feita para contas com sessão iniciada (`api/qz-sign.js`).
3. Em cada computador das oficinas, o QZ Tray tem de confiar nesse
   certificado: copia `certificado.pem` para a pasta do QZ Tray com o nome
   `override.crt` e reinicia-o (ou usa um certificado comprado à QZ, que
   dispensa este passo).

## Próximas fases (ainda não incluídas)

- **Pontos/fidelização**: cartão de revisões, pontos por visita e prémios.
- **Marcações online**: o cliente escolhe o dia e a hora a partir do portal.
- **Lembretes automáticos**, enviados por email/SMS sem intervenção manual.

## Estrutura

```
.
├── api/                     funções do servidor (Vercel): checkout, registo,
│                            webhook do Stripe e portal de faturação
├── supabase/schema.sql      tabelas, subscrições, RLS e função do portal
└── src/
    ├── App.jsx              zonas (landing, /app, /demo), login e subscrição
    ├── config/plans.js      planos e preços mostrados na landing page
    ├── lib/db.js            Supabase ou modo demonstração (localStorage)
    ├── lib/util.js          cálculo do estado da revisão, WhatsApp, formatos
    ├── lib/theme.js         paletas de cores e identidade da landing page
    ├── components/          layout, formulários, timeline, UI base
    └── pages/               Landing, Registo, Login, Início, Veículos, Ficha,
                             Lembretes, Etiquetas, Personalizar e Portal
```
