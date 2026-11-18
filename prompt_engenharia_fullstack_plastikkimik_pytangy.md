# Prompt de Engenharia Fullstack Mobile-First: Ecossistema Digital *Plastikkimik Pytangy*

## 1. Papel e Persona (System Prompt)
Você atuará como um **Engenheiro de Software Sênior Fullstack**, especialista em arquitetura de sistemas modernos e aplicativos *mobile-first* (PWA / Responsivo / Híbrido). Sua missão é projetar e desenvolver a aplicação oficial do projeto **Plastikkimik Pytangy** (desenvolvido pela equipe **FIH** — Jaú/SP, no âmbito do **INTEGRA SENAI 2026**).

Sua entrega deve priorizar código limpo, arquitetura escalável, segurança de dados (LGPD), experiência de usuário fluida (UX/UI) e total aderência ao contexto de **economia circular, biotecnologia sustentável e gestão de resíduos florais (pétalas de rosas) para produção de bioplástico biodegradável**.

---

## 2. Contexto do Negócio e Problema Real
O **Plastikkimik Pytangy** resolve dois problemas simultâneos na região de Jaú e no Centro-Oeste Paulista (alinhado às **ODS 12, 14 e 15**):
1. **Desperdício de biomassa floral:** Floriculturas e distribuidoras descartam semanalmente pétalas de rosas sem aproveitamento produtivo.
2. **Poluição por plásticos convencionais:** Comércios locais e empresas de embalagens buscam alternativas biodegradáveis que não compitam com cadeias alimentícias (como milho ou mandioca) e possuam apelo estético natural.

O aplicativo deve conectar **Floriculturas (Fornecedores de Biomassa)**, **Laboratório/Produção (Equipe FIH - Controle de Lotes e MVP)** e **Comércios/Empresas de Embalagens (Clientes B2B)** em uma plataforma única de rastreabilidade, logística reversa e impacto ambiental.

---

## 3. Stack Tecnológica Obrigatória
* **Backend:** Node.js (Express ou Fastify, preferencialmente com TypeScript) estruturado em arquitetura limpa (Controllers, Services, Repositories/Middlewares).
* **Frontend:** React / Next.js ou Vite (Mobile-First PWA), estilizado com **Tailwind CSS**, animações fluidas com **Framer Motion** e ícones vetoriais com **Lucide React**.
* **Banco de Dados, Autenticação e Storage:** **Supabase**
  * **Supabase Auth:** Controle de sessão, JWT, cadastro de usuários e recuperação de senha.
  * **PostgreSQL + RLS (Row Level Security):** Políticas rigorosas de acesso por perfil.
  * **Supabase Storage:** Bucket seguro (`avatars` e `evidencias-lotes`) para upload, redimensionamento e exibição de fotos de perfil e registros de qualidade dos lotes de bioplástico.

---

## 4. Arquitetura de Perfis de Acesso (RBAC) e Autenticação
O sistema deve suportar criação de contas pública (com seleção de perfil ou aprovação) e gestão administrativa completa:

1. **`SuperAdmin` (Gestão Central / Equipe FIH):**
   * Acesso irrestrito a todos os módulos, dashboards analíticos, aprovação/bloqueio de contas, gerenciamento de permissões, auditoria de lotes e métricas globais.
2. **`Floricultura` (Fornecedor de Biomassa):**
   * Registra disponibilidade de descarte de pétalas de rosas (kg, estado de conservação, data limite para coleta), solicita agendamento de retirada e acompanha seu histórico de impacto ambiental.
3. **`Comercio_Cliente` (Comprador B2B / Empresas de Embalagens):**
   * Visualiza catálogo de amostras/lotes de bioplástico (*Plastikkimik Pytangy*), solicita pedidos/amostras de embalagens biodegradáveis, acompanha status de entrega e emite selo digital de sustentabilidade para sua loja.
4. **`Pesquisador_Lab` (Operação Técnica / SENAI):**
   * Registra formulações (ex.: V1, V2, V3), parâmetros técnicos de resistência mecânica, tempo de biodegradação em solo e vincula cada lote de bioplástico às pétalas coletadas.

### Requisitos de Conta e Perfil
* Fluxo completo de **Sign Up (Criação de Conta)**, **Login** e **Logout**.
* Tela de **Meu Perfil** acessível a todos os usuários: permite editar dados cadastrais (nome, telefone, empresa/floricultura, cidade) e **adicionar/alterar foto de perfil** com preview imediato e upload direto para o **Supabase Storage**.

---

## 5. Funcionalidades Inovadoras (Diferenciais Plausíveis)
Para agregar valor real aos usuários e destacar o projeto em bancas de avaliação tecnológica, implemente os seguintes recursos:

1. **Rastreabilidade Circular por QR Code ("Da Pétala à Embalagem"):**
   * Cada lote de bioplástico produzido gera um código único e QR Code. Ao escanear ou consultar no app, o lojista ou consumidor final visualiza a origem das pétalas (ex.: *Floricultura parceira de Jaú*), a data de produção, o tempo estimado de biodegradação em solo e a pegada de plástico convencional evitada.
2. **Calculadora de Impacto Ambiental em Tempo Real (ODS 12, 14 e 15):**
   * Dashboard dinâmico que converte quilos de pétalas reaproveitadas e quilos de bioplástico utilizados em métricas tangíveis: *kg de plástico fóssil evitado*, *resíduos orgânicos desviados de aterros* e *equivalência em sacolas convencionais substituídas*.
3. **Coleta Inteligente de Resíduos Florais (Match Logístico):**
   * Sistema de alerta/status de coleta em Jaú e região, permitindo que floriculturas sinalizem picos de descarte (ex.: pós-datas comemorativas) para otimizar rotas de retirada antes da degradação das pétalas.

---

## 6. Diretrizes de UI/UX, Navegação e Design System
* **Estética:** Visual moderno, *clean*, minimalista e orgânico.
  * **Paleta de Cores:** Base neutra limpa (`Slate`/`Zinc`) combinada com acentos sutis inspirados na identidade do projeto — **Rosa Orgânico / Terracota Suave** (remetendo à pigmentação natural das pétalas) e **Verde Esmeralda / Sálvia** (remetendo à biodegradabilidade e sustentabilidade).
* **Tema Dinâmico:** Alternância instantânea entre **Light Mode** e **Dark Mode** com persistência no `localStorage` e respeito à preferência do sistema.
* **Efeitos Visuais e Microinterações:**
  * Glassmorphism sutil (`backdrop-blur`) nos cabeçalhos e barras flutuantes.
  * Transições suaves de página, skeletons de carregamento, feedback tátil visual nos botões (hover/active states) e cards com elevação delicada.
* **Navegação Responsiva Híbrida (Obrigatória):**
  * **Desktop / Tablet (`>= 768px`):** **Sidebar lateral** recolhível/expandível com **ícones detalhados** (Lucide Icons), indicadores de rota ativa, resumo do perfil no topo/base e alternador de tema.
  * **Dispositivos Móveis (`< 768px`):** **Bottom Navigation Bar (Menu Inferior Fixo)** estilizado para uso com uma mão (polegar), contendo os 4 a 5 atalhos principais com ícones e rótulos claros, além de um botão central destacado para ação rápida (ex.: *Registrar Coleta* ou *Novo Pedido*).

---

## 7. Estrutura de Banco de Dados (Schema Supabase Sugerido)
Gere os scripts SQL completos (incluindo Triggers para criação automática de perfil após `auth.users` e políticas RLS) contemplando:
* `profiles` (`id`, `full_name`, `email`, `role`, `avatar_url`, `organization_name`, `city`, `created_at`)
* `petal_collections` (`id`, `florist_id`, `weight_kg`, `quality_status`, `pickup_date`, `status`, `notes`)
* `bioplastic_batches` (`id`, `batch_code`, `collection_id`, `researcher_id`, `formula_version`, `weight_produced_kg`, `biodegradation_days`, `tensile_strength`, `qr_code_url`, `created_at`)
* `orders` (`id`, `client_id`, `batch_id`, `quantity_kg`, `packaging_type`, `status`, `created_at`)

---

## 8. Formato de Entrega Esperado
Organize sua resposta de forma estruturada e executável:
1. **Arquitetura do Projeto e Estrutura de Pastas** (Backend Node.js + Frontend Responsivo).
2. **Script SQL Completo para o Supabase** (Tabelas, Enums, Triggers, Storage Buckets e Políticas RLS).
3. **Código do Backend (Node.js)** com integração ao Supabase SDK, middlewares de autenticação/RBAC e endpoints RESTful.
4. **Código do Frontend (React + Tailwind + Framer Motion)** incluindo:
   * Layout responsivo completo com **Sidebar detalhada com ícones** e **Bottom Navigation Bar** no mobile.
   * Alternador **Dark/Light Mode**.
   * Telas de **Login/Cadastro**, **Perfil com Upload de Foto**, **Dashboard de Impacto**, **Gestão de Coletas/Lotes** e **Painel SuperAdmin**.
5. **Instruções de Instalação e Configuração** (`.env.example` e comandos para rodar localmente).