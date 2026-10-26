# Revisa

Histórico digital e lembretes de revisão para oficinas e centros de mudança
de óleo. É uma app separada do AutoTechPro, com o mesmo stack: Vite, React,
Tailwind e Supabase.

"Revisa" é um nome provisório. Para o trocar, altera-o em `index.html`,
`src/pages/Login.jsx` e neste README.

## O que faz

**Painel da oficina** (login com email/palavra-passe):

- **Início**: tem uma pesquisa rápida por matrícula, cliente ou modelo. Mostra
  os contadores de veículos em dia, a vencer e atrasados, e os alertas dos
  veículos sem WhatsApp. Também lista os últimos serviços.
- **Clientes e veículos**: lista com filtros por estado. Cada ficha tem:
  - proprietário e quilometragem;
  - próxima revisão;
  - histórico em timeline;
  - botões para enviar por WhatsApp, abrir o portal, copiar o link, ver o
    cartão QR e ligar.
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
  - **Tamanho**: 100×60 e 100×50 mm (térmicas de 4"), 85×55 mm (cartão),
    62×29 mm (Brother QL) e 50×30 mm (portáteis, tipo Niimbot).
  - **Cópias** por veículo, e descarregar só o QR em PNG.

  Na janela de impressão, escolhe a impressora e o papel com o mesmo tamanho,
  margens "Nenhuma", escala 100% e desativa "Cabeçalhos e rodapés".
- **Personalizar**: logótipo, nome, slogan, cor principal, telefone,
  WhatsApp e morada. Define ainda o intervalo padrão de revisão (km/meses) e
  os limites de aviso (km/dias).

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

## Experimentar já (modo demonstração)

```bash
cd revisa
npm install
npm run dev
```

Abre http://localhost:5174. Sem um ficheiro `.env`, a app arranca em **modo
demonstração**, com 4 veículos de exemplo guardados só neste browser e sem
login. Para recomeçar, usa "Modo demonstração · repor dados" no menu.

Exemplo de portal: http://localhost:5174/v/demo0000000000000000001a

## Pôr a funcionar a sério (Supabase)

1. Cria um projeto em https://supabase.com. Pode ser um projeto novo,
   separado do AutoTechPro.
2. Em **SQL Editor**, corre o conteúdo de `supabase/schema.sql`.
3. Em **Authentication → URL Configuration**, define o **Site URL** com o
   endereço onde a app vai ficar (por exemplo, `https://revisa.vercel.app`).
4. Copia `.env.example` para `.env` e preenche `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (em **Project Settings → API**).
5. `npm run dev`, cria a conta na página de login e confirma o email.

Cada conta é uma oficina independente. As políticas RLS garantem que cada
oficina só vê os seus próprios clientes, veículos e serviços.

## Deploy (Vercel)

1. Na Vercel, cria um projeto a partir deste repositório e define o **Root
   Directory** como `revisa`.
2. Adiciona as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. O `vercel.json` já reencaminha todas as rotas para o `index.html`, para
   que os links `/v/...` funcionem.

## Próximas fases (ainda não incluídas)

- **Pontos/fidelização**: cartão de revisões, pontos por visita e prémios.
- **Marcações online**: o cliente escolhe o dia e a hora a partir do portal.
- **Lembretes automáticos**, enviados por email/SMS sem intervenção manual.

## Estrutura

```
revisa/
├── supabase/schema.sql      tabelas, RLS e função do portal público
└── src/
    ├── App.jsx              autenticação, estado global e rotas
    ├── lib/db.js            Supabase ou modo demonstração (localStorage)
    ├── lib/util.js          cálculo do estado da revisão, WhatsApp, formatos
    ├── components/          layout, formulários, timeline, UI base
    └── pages/               Início, Veículos, Ficha, Lembretes, Cartões,
                             Personalizar, Login e Portal do cliente
```
