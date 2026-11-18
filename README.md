# Plastikkimik Pytangy · Demo MVC

Demo web funcional do ecossistema **Plastikkimik Pytangy**, projeto da equipe **FIH** (Jaú/SP) para o **INTEGRA SENAI 2026**. A aplicação conecta floriculturas, laboratório e comércios B2B em um ciclo rastreável de aproveitamento de pétalas de rosas para produção de bioplástico biodegradável.

> **Status:** demonstração navegável de ponta a ponta, com dados de seed, autenticação, RBAC, QR Code público e selo verde. O banco local é SQLite; na Vercel ele é efêmero (ver [limitações](#limitações-e-próximos-passos)).

---

## Sumário

- [Visão geral](#visão-geral)
- [O problema e a proposta](#o-problema-e-a-proposta)
- [O que o demo entrega](#o-que-o-demo-entrega)
- [Stack e decisões de arquitetura](#stack-e-decisões-de-arquitetura)
- [Perfis e permissões](#perfis-e-permissões)
- [Fluxo principal](#fluxo-principal)
- [Regras de negócio e fatores de impacto](#regras-de-negócio-e-fatores-de-impacto)
- [Arquitetura MVC](#arquitetura-mvc)
- [Modelo de dados](#modelo-de-dados)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Contas demo](#contas-demo)
- [Rotas](#rotas)
- [Testes e validação](#testes-e-validação)
- [Deploy na Vercel](#deploy-na-vercel)
- [Limitações e próximos passos](#limitações-e-próximos-passos)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Créditos](#créditos)

---

## Visão geral

O projeto nasceu de dois problemas simultâneos na região de Jaú e no Centro-Oeste Paulista, alinhados às **ODS 12, 14 e 15**:

1. **Desperdício de biomassa floral** — floriculturas descartam pétalas de rosas sem aproveitamento produtivo.
2. **Poluição por plásticos convencionais** — comércios buscam alternativas biodegradáveis que não compitam com a cadeia alimentícia.

A plataforma organiza a logística reversa das pétalas, registra a produção de lotes de bioplástico, permite pedidos B2B e comprova o impacto ambiental por meio de rastreio público com QR Code e selo digital.

Este repositório é um **demo web em MVC clássico**, pensado para apresentação em banca e deploy rápido na Vercel, sem depender de build de frontend nem de banco externo.

---

## O problema e a proposta

| Dimensão | Proposta do projeto |
| --- | --- |
| Biomassa | Retirar pétalas de rosas do descarte e transformá-las em matéria-prima para bioplástico |
| Produção | Registrar fórmula, resistência mecânica, biodegradação e vínculo com a coleta de origem |
| Comércio | Ofertar lotes rastreados a comércios e empresas de embalagens |
| Transparência | Página pública por código de rastreio e QR Code imprimível em cada lote |
| Impacto | Converter massa reaproveitada em plástico fóssil evitado, CO₂ evitado e sacolas equivalentes |
| Governança | SuperAdmin aprova, bloqueia e reativa contas; laboratório avança coletas, lotes e pedidos |

O demo cobre o ciclo completo **pétala → coleta → lote → pedido → entrega → selo**, com dados de demonstração já vinculados.

---

## O que o demo entrega

- Home pública institucional, login, cadastro e recuperação de senha.
- Autenticação por sessão, senhas com `bcrypt` e RBAC por perfil.
- Dashboard adaptado a cada perfil, com indicadores, gráfico de 6 meses e atividades recentes.
- Coletas de pétalas: criação pela floricultura, avanço de status e cancelamento.
- Lotes de bioplástico: criação a partir de coleta, ficha técnica, estoque, QR Code e linha do tempo.
- Pedidos B2B: catálogo de lotes disponíveis, reserva de volume, fluxo de status e entrega.
- Rastreio público em `/r/:code`, com QR PNG para download e consulta por código.
- Selo verde do cliente com métricas de impacto, QR do último lote entregue e impressão.
- Perfil com edição de dados, troca de senha e avatar (JPG/PNG/WebP até 1,5 MB).
- Painel SuperAdmin com busca, filtro e aprovação/bloqueio/reativação de usuários.
- UI em português, mobile-first, tema claro/escuro persistente, sidebar recolhível e bottom nav com FAB.
- Páginas de erro 403, 404 e 500 com identidade visual do projeto.

---

## Stack e decisões de arquitetura

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Servidor | **Express 4** | Simplicidade, maturidade e deploy direto em serverless |
| Views | **EJS + express-ejs-layouts** | Renderização no servidor, layout compartilhado e zero build |
| Estilo | **Bootstrap 5 via CDN + CSS próprio** | Responsividade rápida com identidade visual autoral |
| Ícones | **Bootstrap Icons 1.11.3 via CDN** | Consistência e ausência de build |
| Banco | **SQLite via `sql.js` (WASM)** | Sem dependência nativa, funciona localmente e na Vercel |
| Sessão | **`cookie-session`** | Sessão assinada em cookie, adequada a múltiplas instâncias serverless |
| Senhas | **`bcryptjs`** | Hash de senha sem binário nativo |
| QR Code | **`qrcode`** | Geração de PNG e Data URL no servidor |
| Upload | **`multer` em memória + Data URL** | Avatar persiste no banco, sem disco local |

### Por que não React/Supabase neste demo?

A proposta original previa React/Next, Tailwind e Supabase. Para a entrega de banca, o objetivo foi maximizar **portabilidade, tempo de setup e previsibilidade de deploy**. O monólito MVC com EJS:

- roda com `npm install && npm start`;
- não exige build, variáveis de banco externo nem configuração de RLS;
- mantém o fluxo completo demonstrável em qualquer máquina;
- preserva a separação de responsabilidades (controllers, models, services, middlewares e views), facilitando uma migração futura para API + SPA.

A pasta [`legacy/`](legacy/) guarda a implementação anterior em React/Express/Supabase, mantida apenas como referência histórica.

---

## Perfis e permissões

| Recurso | SuperAdmin | Floricultura | Pesquisador · Lab | Comércio B2B |
| --- | --- | --- | --- | --- |
| Dashboard | global | próprio impacto | próprios lotes | impacto entregue |
| Coletas | gerenciar todas | criar e acompanhar as próprias | avançar/cancelar | — |
| Lotes | gerenciar todos | ver os próprios | criar, gerir e gerar QR | ver catálogo |
| Pedidos | gerenciar todos | — | gerenciar todos | criar e acompanhar os próprios |
| Selo verde | — | — | — | próprio selo |
| Administração | completa | — | — | — |
| Perfil | próprio | próprio | próprio | próprio |

O RBAC é aplicado no servidor por `requireRole`, além de filtros de escopo nos models (por floricultura, cliente ou pesquisador). As rotas públicas de rastreio não exigem login.

---

## Fluxo principal

1. **Floricultura** registra uma coleta com peso, qualidade, endereço e data de retirada.
2. **Laboratório** avança a coleta: `solicitada → agendada → coletada`.
3. **Laboratório** cria um lote vinculado à coleta, informa fórmula, produção e biodegradação; o sistema gera código de lote e trace code.
4. **QR Code** do lote é exibido na ficha interna e na página pública.
5. **Comércio B2B** escolhe um lote com volume disponível e cria um pedido.
6. **Laboratório** avança o pedido: `solicitado → em_analise → aprovado → em_producao → entregue`.
7. **Cliente** acompanha o pedido, consulta o rastreio e imprime o **selo verde** com o impacto acumulado.
8. **SuperAdmin** aprova novas contas, bloqueia/reativa usuários e acompanha a operação global.

O roteiro de demonstração recomendado está nas [contas demo](#contas-demo).

---

## Regras de negócio e fatores de impacto

Fatores usados pelo MVP (centralizados em `src/services/impact.js`):

| Fator | Valor |
| --- | --- |
| Rendimento de bioplástico | **0,3 kg** de bioplástico por kg de pétalas |
| Plástico fóssil evitado | **1 kg** por kg de bioplástico |
| Peso de sacola equivalente | **5 g** (0,005 kg) |
| CO₂ evitado | **3,2 kg** por kg de bioplástico |

Regras complementares:

- Cada lote deve estar vinculado a uma coleta existente; o volume disponível é `produzido − reservado`.
- Pedidos não cancelados reservam volume do lote (incluindo entregues, que representam consumo).
- Só é possível avançar status na sequência definida; cancelamentos são permitidos enquanto o fluxo não termina.
- Um lote só pode ser arquivado quando não houver pedidos ativos.
- O impacto pessoal do cliente considera apenas **pedidos entregues**; o selo e o dashboard usam a mesma base.
- Coletas canceladas não entram no impacto; coletas só contam após `coletada` ou `processada`.
- O cadastro público entra como **ativo** por padrão (`SIGNUP_AUTO_APPROVE=true`); com `false`, entra como pendente e depende do SuperAdmin.
- O seed inclui uma conta pendente para demonstrar a aprovação no painel administrativo.

---

## Arquitetura MVC

```text
projeto/
├── api/
│   └── index.js              # Entrypoint serverless da Vercel
├── database/
│   ├── schema.sql            # Tabelas, constraints e índices
│   └── seed.js               # Dados demo idempotentes
├── scripts/
│   ├── reset-db.js           # Remove o SQLite local
│   ├── smoke-test.js         # 51 verificações de rotas e RBAC
│   └── flow-test.js          # 43 verificações do fluxo completo em banco temporário
├── src/
│   ├── app.js                # Express, sessão, layouts, middlewares globais
│   ├── config/               # Constantes, ambiente e contas demo
│   ├── controllers/          # Ações por módulo (MVC)
│   ├── db/index.js           # sql.js, schema, persistência e seed
│   ├── middleware/           # auth, flash e upload
│   ├── models/               # Consultas e regras de persistência
│   ├── public/               # CSS e JS do cliente
│   ├── routes/               # Rotas públicas e autenticadas
│   ├── services/impact.js    # Cálculos ambientais e snapshots
│   ├── utils/                # Formatação, validação e URLs
│   └── views/                # EJS: layouts, partials e páginas
├── legacy/                   # Implementação anterior (referência)
├── .env.example
├── package.json
├── server.js                 # Entrypoint local
└── vercel.json
```

**Responsabilidades:**

- **Model** — SQL, mapeamento de linhas e agregações (ex.: `Batch.availableKg`).
- **View** — EJS com partials e layouts; nenhuma regra de negócio pesada.
- **Controller** — validação de entrada, autorização contextual, flash messages e render/redirect.
- **Service** — cálculos de impacto e snapshots usados por dashboard, selo e página pública.
- **Middleware** — sessão, usuário atual, RBAC, flash e upload.

A persistência local acontece em `data/plastikkimik.sqlite`. O arquivo é regravado após cada operação de escrita e recriado com seed quando não existe.

---

## Modelo de dados

| Tabela | Conteúdo |
| --- | --- |
| `users` | Nome, e-mail único, hash de senha, perfil, status, organização, cidade, telefone e avatar |
| `petal_collections` | Floricultura, peso, qualidade, data de retirada, endereço, observações e status |
| `bioplastic_batches` | Código, coleta de origem, pesquisador, fórmula, produção, biodegradação, resistência, trace code e status |
| `orders` | Cliente, lote, quantidade, formato de embalagem, status e observações |
| `password_resets` | Token de recuperação, expiração e marcação de uso |

Constraints no banco validam perfis, status, pesos positivos e formatos de embalagem. Índices cobrem floricultura, lote, trace code e cliente.

---

## Como rodar localmente

**Pré-requisitos:** Node.js **20 ou superior** e npm.

```bash
# 1. Instale as dependências
npm install

# 2. (Opcional) Crie o arquivo de ambiente
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/macOS

# 3. Suba o servidor
npm run dev                   # com reload automático
# ou
npm start
```

Acesse **http://localhost:3000**. Na primeira execução, o banco é criado e populado automaticamente com o seed de demonstração.

```bash
# Remover o banco local (o próximo start recria o seed)
npm run db:reset

# Rodar as verificações de fumaça (51 checks)
npm run check
```

> `npm run check` sobe uma instância própria em porta aleatória; não é necessário ter o servidor da porta 3000 rodando. Se você resetar o banco com o servidor aberto, reinicie-o para recarregar o seed.

---

## Variáveis de ambiente

Todas são opcionais em desenvolvimento. Em produção, **defina ao menos `SESSION_SECRET`**.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta do servidor local |
| `NODE_ENV` | `development` | Ambiente de execução |
| `SESSION_SECRET` | segredo interno de demo | Chave de assinatura do cookie de sessão |
| `PUBLIC_APP_URL` | vazio | URL pública usada nos QR Codes; se vazia, usa o host da requisição |
| `SIGNUP_AUTO_APPROVE` | `true` | `false` faz novos cadastros entrarem como pendentes |
| `DEMO_LOGIN` | `true` | `false` desabilita o login rápido por e-mail |
| `DEMO_PASSWORD` | `Demo@1234` | Senha das contas de demonstração criadas pelo seed |
| `DATABASE_FILE` | `./data/plastikkimik.sqlite` | Caminho do SQLite local (ignorado na Vercel) |

---

## Contas demo

Senha padrão: **`Demo@1234`**

| Perfil | E-mail | Organização | Onde atuar |
| --- | --- | --- | --- |
| SuperAdmin | `admin@fih.com` | Equipe FIH | `/app/admin` |
| Floricultura | `floricultura@jau.com` | Floricultura Rosa de Jaú | `/app/coletas` |
| Pesquisador · Lab | `lab@senai.com` | Laboratório SENAI | `/app/lotes` |
| Comércio B2B | `cliente@embalagens.com` | EcoEmbalagens B2B | `/app/pedidos` e `/app/selo` |

Há ainda uma conta **pendente** (`contato@florlux.com`) para demonstrar a aprovação no painel do SuperAdmin, e uma segunda conta de comércio para testes de bloqueio.

### Login rápido

- Na tela de login, os botões de conta demo preenchem as credenciais.
- O endpoint `POST /demo-login` autentica apenas e-mails das contas demo e pode ser desligado com `DEMO_LOGIN=false`.
- A home e a tela de login exibem os atalhos de demonstração.

### Roteiro sugerido para a banca

1. Entre como **floricultura**, registre uma coleta e mostre o impacto local.
2. Entre como **laboratório**, avance a coleta, crie um lote e abra o QR Code.
3. Abra a página pública em outra aba e mostre a rastreabilidade sem login.
4. Entre como **cliente**, faça um pedido, avance-o como laboratório e confira o selo verde.
5. Entre como **SuperAdmin**, aprove a conta pendente e mostre o dashboard global.
6. Alterne tema claro/escuro, recolha a sidebar e teste o layout mobile.

---

## Rotas

### Públicas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Home institucional |
| `GET` | `/health` | Health check com contagens do seed |
| `GET` | `/login` | Tela de login |
| `POST` | `/login` | Login por e-mail e senha |
| `POST` | `/demo-login` | Login rápido das contas demo |
| `POST` | `/logout` | Encerra a sessão |
| `GET/POST` | `/cadastro` | Cadastro público |
| `GET/POST` | `/recuperar-senha` | Solicitação de recuperação (link exibido na tela no modo demo) |
| `GET/POST` | `/redefinir-senha/:token` | Definição de nova senha |
| `GET` | `/rastreio` | Consulta pública por código |
| `GET` | `/r/:code` | Página pública do lote |
| `GET` | `/r/:code/qr.png` | QR Code PNG (download opcional com `?download=1`) |

### Autenticadas (`/app`)

| Método | Rota | Perfis |
| --- | --- | --- |
| `GET` | `/app` | Todos |
| `GET` | `/app/coletas` | SuperAdmin, Floricultura, Lab |
| `GET` | `/app/coletas/nova` | Floricultura |
| `POST` | `/app/coletas` | Floricultura |
| `POST` | `/app/coletas/:id/status` | SuperAdmin, Floricultura, Lab |
| `GET` | `/app/lotes` | Todos |
| `GET` | `/app/lotes/novo` | SuperAdmin, Lab |
| `POST` | `/app/lotes` | SuperAdmin, Lab |
| `GET` | `/app/lotes/:id` | Todos (floricultura limitada aos próprios) |
| `POST` | `/app/lotes/:id/status` | SuperAdmin, Lab |
| `GET` | `/app/pedidos` | SuperAdmin, Lab, Cliente |
| `GET` | `/app/pedidos/novo` | Cliente |
| `POST` | `/app/pedidos` | Cliente |
| `POST` | `/app/pedidos/:id/status` | SuperAdmin, Lab, Cliente (cancelamento do próprio) |
| `GET` | `/app/selo` | Cliente |
| `GET` | `/app/admin` | SuperAdmin |
| `POST` | `/app/admin/usuarios/:id/status` | SuperAdmin |
| `GET` | `/app/perfil` | Todos |
| `POST` | `/app/perfil` | Todos |
| `POST` | `/app/perfil/avatar` | Todos |
| `POST` | `/app/perfil/avatar/remover` | Todos |
| `POST` | `/app/perfil/senha` | Todos |

**Códigos de rastreio do seed:** `PYTA1B2`, `PYTA2C3`, `PYTA3D4`, `PYTA4E5`, `PYTA5F6`, `PYTA6G7`.

---

## Testes e validação

### Smoke test (`npm run check`)

Sobe o app em uma porta efêmera e executa **51 verificações**:

- health check e contagens do seed;
- rotas públicas, assets, QR PNG e 404 de rastreio;
- redirecionamento de área protegida sem sessão;
- login das quatro contas demo e respeito ao RBAC;
- páginas principais por perfil (dashboards, coletas, lotes, pedidos, selo, perfil e admin).

### Fluxo completo (`npm run test:flow`)

Executa **43 verificações** em um SQLite temporário e isolado, sem alterar o seed local. Cobre criação de coleta, avanço de status, geração de lote e QR, pedido, entrega, selo, impacto do cliente (8,8 kg → 9,8 kg), aprovação/bloqueio de usuários, perfil, cadastro público e validações de entrada. O roteiro manual equivalente está em [Roteiro sugerido para a banca](#roteiro-sugerido-para-a-banca).

### Verificações já realizadas

- Layout desktop e mobile (390×844) em tema claro e escuro.
- Sidebar recolhível, offcanvas, bottom nav e FAB.
- QR Code público e download PNG.
- Impressão do selo verde.
- 68 ícones do Bootstrap Icons conferidos contra o CDN (nenhum ausente).
- `npm install` sem vulnerabilidades conhecidas.

---

## Deploy na Vercel

O projeto já inclui `vercel.json` com rewrite para a função serverless e inclusão explícita de views, assets, seed e WASM.

### Passo a passo

1. **Suba o repositório** para GitHub/GitLab/Bitbucket.
2. **Importe o projeto** em [vercel.com/new](https://vercel.com/new).
3. Use o preset **Other** (sem framework). Não é necessário build command nem output directory.
4. Configure as variáveis de ambiente:

   | Variável | Valor sugerido |
   | --- | --- |
   | `SESSION_SECRET` | string longa e aleatória |
   | `PUBLIC_APP_URL` | `https://seu-projeto.vercel.app` |
   | `SIGNUP_AUTO_APPROVE` | `true` para demo |
   | `DEMO_LOGIN` | `true` para demo |
   | `DEMO_PASSWORD` | `Demo@1234` ou outra senha |

5. Faça o deploy. A primeira requisição inicializa o banco em memória e aplica o seed.
6. Valide `https://seu-projeto.vercel.app/health`.

### Via CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

### Como o deploy funciona

- `api/index.js` inicializa o banco uma única vez por instância e delega as requisições ao Express.
- `vercel.json` garante que `src/views`, `src/public`, `database` e `sql-wasm.wasm` sejam incluídos na função.
- Sessões usam cookie assinado e não dependem da memória do servidor; as contas do seed são reconhecidas em qualquer instância.
- Avatares são gravados como Data URL no próprio banco, sem depender de disco.

> **Atenção:** em produção real, troque `SESSION_SECRET` e desative `DEMO_LOGIN`. O login demo é um atalho de apresentação, não um mecanismo de autenticação seguro.

---

## Limitações e próximos passos

### Limitações do demo

- **SQLite efêmero na Vercel:** o banco vive em memória por instância e é recriado com seed a cada cold start. Alterações feitas em uma instância não são compartilhadas com outras. É ideal para demonstração, **não para produção**.
- **Uploads efêmeros na Vercel:** o avatar fica no banco da instância; em um cold start, volta ao estado do seed.
- **Recuperação de senha sem e-mail:** no modo demo, o link de redefinição é exibido na própria tela. Em produção, integre um provedor de e-mail.
- **Sem auditoria persistente:** não há trilha de auditoria, notificações ou integrações de pagamento/logística.
- **Sem PWA/offline:** a interface é responsiva, mas não inclui service worker nem instalabilidade.
- **Sessão em cookie:** adequada ao demo; para produção, avalie um store de sessões ou autenticação stateless com JWT.

### Evolução recomendada

1. Migrar a persistência para **PostgreSQL/Supabase** com RLS e storage de avatares.
2. Adicionar trilha de auditoria por operação e logs estruturados.
3. Implementar e-mail transacional para recuperação de senha e notificações de status.
4. Criar API versionada e, se necessário, evoluir o frontend para SPA/PWA.
5. Adicionar testes automatizados de fluxo completo em CI e cobertura de regressão visual.
6. Integrar cálculo de rotas de coleta e relatórios exportáveis (CSV/PDF).

---

## Estrutura do repositório

| Caminho | Papel |
| --- | --- |
| `server.js` | Start local com inicialização do banco |
| `api/index.js` | Handler serverless da Vercel |
| `src/app.js` | Configuração do Express e middlewares globais |
| `src/routes/` | Rotas públicas e autenticadas |
| `src/controllers/` | Controllers MVC por domínio |
| `src/models/` | Acesso a dados e agregações |
| `src/services/impact.js` | Fatores e cálculos ambientais |
| `src/views/` | Layouts, partials e páginas EJS |
| `src/public/` | CSS e JavaScript do cliente |
| `database/` | Schema e seed |
| `scripts/` | Reset do banco e smoke test |
| `legacy/` | Implementação anterior mantida como referência |
| `data/` | Banco SQLite local gerado em runtime (não versionar) |

---

## Créditos

- **Projeto:** Plastikkimik Pytangy — equipe **FIH**, Jaú/SP.
- **Contexto:** **INTEGRA SENAI 2026**.
- **Tema:** economia circular, biotecnologia sustentável e logística reversa de resíduos florais.
- **ODS:** 12 (consumo e produção responsáveis), 14 (vida na água) e 15 (vida terrestre).

Este repositório tem finalidade educacional e demonstrativa. A implementação anterior em React/Express/Supabase permanece em `legacy/` apenas como registro do processo.
