# Plastikkimik Pytangy

Plataforma oficial do projeto **Plastikkimik Pytangy** — ecossistema digital que conecta floriculturas, laboratório e comércio B2B para transformar pétalas de rosas descartadas em bioplástico biodegradável rastreável.

> **Equipe FIH · Jaú/SP · INTEGRA SENAI 2026**  
> ODS 12 · 14 · 15 · Economia circular · Biotecnologia sustentável

---

## 1. Visão geral

O sistema cobre a jornada **“Da pétala à embalagem”**:

1. **Floricultura** registra a disponibilidade de pétalas e acompanha a coleta.
2. **Laboratório** confirma a retirada, registra formulações, parâmetros técnicos e gera um QR Code público por lote.
3. **Comércio B2B** consulta o catálogo, solicita pedidos e acompanha a entrega.
4. **SuperAdmin** aprova contas, bloqueia acessos e audita a operação.
5. **Qualquer pessoa** escaneia o QR Code e consulta origem, ficha técnica, linha do tempo e impacto ambiental do lote, sem criar conta.

### Principais recursos entregues

- Cadastro, login, logout e recuperação de senha.
- RBAC com quatro perfis: `superadmin`, `floricultura`, `comercio_cliente`, `pesquisador_lab`.
- Aprovação, bloqueio, reativação e alteração de permissões de contas.
- Coletas de pétalas com match logístico e status (`solicitada → agendada → coletada → processada`).
- Lotes de bioplástico com formulação, evidência de qualidade, código de rastreio e QR Code.
- Pedidos B2B com controle de disponibilidade, linha de status e cancelamento.
- Dashboard de impacto em tempo real, gráfico mensal e selo digital de sustentabilidade.
- Página pública de rastreabilidade `/r/:code` com QR Code para download.
- Perfil editável com upload de foto, preview imediato e redimensionamento para 512 px no navegador.
- Tema claro/escuro persistido no navegador.
- Layout mobile-first: sidebar recolhível no desktop, bottom navigation com FAB no mobile, glassmorphism, skeletons e animações.
- Modo demo em memória para rodar sem nenhuma credencial externa.

---

## 2. Stack

| Camada | Tecnologia |
| --- | --- |
| Backend | Node.js, Express, TypeScript, Zod, JWT, Multer, QRCode |
| Banco/Auth/Storage | Supabase (PostgreSQL, Auth, RLS, Storage) |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide |
| Monorepo | npm workspaces + `concurrently` |

O frontend consome apenas a **API REST** do backend. A chave `service_role` do Supabase nunca é exposta ao navegador.

---

## 3. Estrutura do projeto

```text
projeto/
├─ backend/
│  ├─ src/
│  │  ├─ config/          # ambiente e clientes Supabase
│  │  ├─ domain/          # tipos e cálculo de impacto
│  │  ├─ middleware/      # auth, RBAC, validação, erros
│  │  ├─ repositories/    # memória (demo) + Supabase
│  │  ├─ routes/          # contratos REST
│  │  ├─ services/        # regras de negócio
│  │  ├─ utils/           # QR Code, senhas, códigos
│  │  ├─ app.ts
│  │  └─ server.ts
│  └─ .env.example
├─ frontend/
│  ├─ src/
│  │  ├─ components/      # design system, layout, auth shell
│  │  ├─ contexts/        # auth, tema, toasts
│  │  ├─ pages/           # telas da aplicação e página pública
│  │  ├─ hooks/
│  │  ├─ lib/
│  │  └─ main.tsx
│  ├─ index.html
│  └─ .env.example
├─ supabase/
│  └─ schema.sql          # enums, tabelas, triggers, RLS, buckets e view pública
├─ package.json
└─ README.md
```

---

## 4. Como rodar localmente (modo demo)

### Requisitos

- Node.js **20+** (testado com Node 24)
- npm 10+

### Passos

```bash
npm install
npm run dev
```

Acesse:

- Frontend: **http://localhost:5173**
- API: **http://localhost:3333/api/health**
- Página pública de exemplo: **http://localhost:5173/r/PYTA1B2**

Não é necessário criar `.env` para o modo demo. Sem credenciais Supabase, o backend usa automaticamente um repositório em memória com dados realistas.

### Contas de demonstração

Senha única: **`Demo@1234`**

| E-mail | Perfil |
| --- | --- |
| `admin@fih.com` | SuperAdmin · Equipe FIH |
| `floricultura@jau.com` | Floricultura Rosa de Jaú |
| `lab@senai.com` | Laboratório de Biotecnologia SENAI |
| `cliente@embalagens.com` | EcoEmbalagens B2B |

Contas extras: `floricultura2@jau.com` e `compras@verde.com` (ativas), `contato@florlux.com` (pendente de aprovação).

> No modo demo, os dados vivem em memória. Reiniciar a API restaura o estado inicial. Avatares e evidências são convertidos em `data:` URLs temporárias.

### Scripts úteis

```bash
npm run dev          # API + frontend
npm run dev:api      # somente API
npm run dev:web      # somente frontend
npm run typecheck    # TypeScript no backend e frontend
npm run build        # build de produção dos dois apps
npm start            # inicia o backend compilado (dist)
```

---

## 5. Configuração de produção com Supabase

### 5.1 Criar o projeto

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor** e execute o arquivo completo [`supabase/schema.sql`](supabase/schema.sql).
3. O script cria enums, tabelas, triggers, políticas RLS, buckets `avatars` e `evidencias-lotes`, grants e a view pública `public_trace`.
4. Em **Authentication → URL Configuration**, configure:
   - **Site URL:** `https://seu-dominio.com` (ou `http://localhost:5173` em desenvolvimento)
   - **Redirect URLs:** `https://seu-dominio.com/redefinir-senha` e `http://localhost:5173/redefinir-senha`

### 5.2 Configurar o backend

```bash
cp backend/.env.example backend/.env
```

No Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Preencha:

```dotenv
DEMO_MODE=false
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=um-segredo-longo-e-aleatorio
PUBLIC_APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
SIGNUP_AUTO_APPROVE=false
```

> `SUPABASE_SERVICE_ROLE_KEY` é secreta e deve existir apenas no servidor.
> Com `SIGNUP_AUTO_APPROVE=false`, novos cadastros entram como `pending` e precisam ser aprovados no painel SuperAdmin.

### 5.3 Criar o primeiro SuperAdmin

Crie sua conta pelo app (ela nascerá como `pending`) e execute no SQL Editor:

```sql
update public.profiles
set role = 'superadmin', status = 'active'
where email = 'seu-email@dominio.com';
```

Depois disso, use o painel **Administração** para aprovar os demais cadastros.

### 5.4 Frontend

O proxy do Vite já encaminha `/api` para `http://localhost:3333`. Para apontar para uma API publicada, crie `frontend/.env`:

```dotenv
VITE_API_URL=https://api.seudominio.com/api
```

### 5.5 Build de produção

```bash
npm run build
npm start          # backend em http://localhost:3333
```

Sirva `frontend/dist` em um host estático com fallback de SPA para `index.html` (necessário para rotas como `/r/:code`, `/app/pedidos` e `/redefinir-senha`).

Lembre-se de ajustar:

- `PUBLIC_APP_URL` para a URL pública real (usada nos links e QR Codes).
- `CORS_ORIGIN` para o domínio do frontend.
- `VITE_API_URL` para a URL pública da API.

---

## 6. Perfis e permissões

| Módulo | SuperAdmin | Floricultura | Laboratório | Comércio B2B |
| --- | :---: | :---: | :---: | :---: |
| Dashboard de impacto | ✅ | ✅ | ✅ | ✅ |
| Coletas | ✅ | ✅ (próprias) | ✅ | — |
| Lotes | ✅ | — | ✅ | ✅ (catálogo) |
| Pedidos | ✅ | — | ✅ | ✅ (próprios) |
| Administração de contas | ✅ | — | — | — |
| Perfil e foto | ✅ | ✅ | ✅ | ✅ |
| Rastreio público | ✅ | ✅ | ✅ | ✅ |

Proteções implementadas no backend:

- SuperAdmin não pode alterar o próprio perfil de acesso.
- O sistema impede remover o último SuperAdmin ativo.
- Cliente só cancela pedidos antes de entrarem em produção.
- Transições de status são validadas por máquina de estados.
- Estoque de cada lote considera todos os pedidos não cancelados.
- Rotas protegidas por JWT e RBAC, com RLS no Supabase.
- A página pública expõe apenas organização, cidade, peso, qualidade, formulação, status, data e impacto — nunca e-mail, telefone ou endereço.

---

## 7. API REST (resumo)

Base: `/api`

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Saúde da API e indicação do modo demo |
| `POST` | `/auth/signup` | Cadastro público |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/forgot-password` | Solicita recuperação de senha |
| `POST` | `/auth/reset-password` | Redefine senha com token |
| `GET` | `/auth/me` | Sessão atual |
| `GET/PATCH` | `/profile` | Dados cadastrais |
| `POST` | `/profile/avatar` | Upload do avatar |
| `GET/POST` | `/collections` | Lista/cria coletas |
| `PATCH` | `/collections/:id` | Atualiza status/dados da coleta |
| `GET/POST` | `/batches` | Lista/cria lotes |
| `PATCH` | `/batches/:id` | Atualiza lote |
| `POST` | `/batches/:id/evidence` | Evidência de qualidade |
| `GET/POST` | `/orders` | Lista/cria pedidos |
| `PATCH` | `/orders/:id` | Atualiza status/notas |
| `GET` | `/impact` | Métricas globais, pessoais, mensais e contadores |
| `GET` | `/admin/users` | Lista contas (SuperAdmin) |
| `PATCH` | `/admin/users/:id` | Altera perfil/status (SuperAdmin) |
| `GET` | `/public/trace/:code` | Rastreabilidade pública |
| `GET` | `/public/trace/:code/qr.png` | QR Code PNG do lote |

Envelopes de resposta: `{ collections }`, `{ collection }`, `{ batches }`, `{ batch }`, `{ orders }`, `{ order }`, `{ impact }`, `{ users }`, `{ user }`, `{ trace }` e sessão `{ token, user, pending, demo }`. Erros seguem `{ error: { code, message, details } }`.

---

## 8. Cálculo de impacto

Fatores do MVP centralizados em `backend/src/domain/impact.ts`:

| Indicador | Fator |
| --- | --- |
| Rendimento pétalas → bioplástico | 0,3 kg por kg |
| Plástico fóssil evitado | 1 kg por kg de bioplástico |
| Sacola convencional equivalente | 5 g |
| CO₂ evitado | 3,2 kg por kg de bioplástico |

Os fatores são parametrizados e podem ser calibrados com laudos do laboratório sem alterar os demais módulos.

---

## 9. Segurança e LGPD

- Senhas nunca são retornadas pela API; no modo demo são armazenadas com `scrypt`.
- Em produção, autenticação e senhas ficam no Supabase Auth.
- JWT validado em todas as rotas autenticadas.
- RBAC no backend + RLS no PostgreSQL (defesa em profundidade).
- Rate limit nas rotas de autenticação.
- Upload restrito a JPG/PNG/WEBP com limite de tamanho.
- Avatar comprimido para 512 × 512 JPEG no navegador antes do upload.
- Página pública omite dados pessoais e de contato.
- Buckets públicos apenas para leitura de imagens; escrita restrita por política.
- Aviso de privacidade e consentimento no cadastro.

---

## 10. Validação executada

```text
npm run typecheck   ✅ backend + frontend
npm run build       ✅ API compilada + frontend Vite
GET  /api/health    ✅ modo demo
POST /api/auth/login (4 perfis) ✅
GET  /api/collections / /impact / /admin/users ✅
POST /api/orders + PATCH cancelamento/status ✅
PATCH /api/admin/users (aprovar/bloquear/reativar) ✅
PATCH /api/profile + POST /api/profile/avatar ✅
GET  /api/public/trace/PYTA1B2 ✅
GET  /api/public/trace/PYTA1B2/qr.png ✅ image/png
Frontend http://localhost:5173 + proxy /api ✅
Rota SPA /r/PYTA1B2 ✅
```

---

## 11. Observações

- O modo demo é intencionalmente autocontido e não persiste dados entre reinícios.
- O primeiro SuperAdmin precisa ser promovido manualmente no Supabase; não há autopromoção pelo cadastro público.
- A recuperação de senha no modo demo é informativa. Em produção usa o fluxo do Supabase Auth.
- Para gerar novos QR Codes em produção, `PUBLIC_APP_URL` deve apontar para o domínio real do frontend.
- O projeto está licenciado para uso acadêmico no contexto do INTEGRA SENAI 2026.
