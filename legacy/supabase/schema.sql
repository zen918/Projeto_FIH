-- ============================================================================
--  PLASTIKKIMIK PYTANGY · SCHEMA SUPABASE (PostgreSQL)
--  Projeto FIH · INTEGRA SENAI 2026 · Jaú/SP
--
--  Como aplicar:
--    1. Crie um projeto em https://supabase.com
--    2. Abra o SQL Editor e cole/execute este arquivo inteiro.
--    3. Crie os usuários pelo cadastro do app (ou Authentication > Users).
--    4. Promova o primeiro SuperAdmin com o SQL indicado no final do arquivo.
--    5. Configure o backend com as chaves do projeto e DEMO_MODE=false.
--
--  O script é idempotente: pode ser executado novamente em caso de ajustes.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

do $$ begin
  create type public.user_role as enum ('superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('pending', 'active', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.collection_status as enum ('solicitada', 'agendada', 'coletada', 'processada', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.petal_quality as enum ('excelente', 'boa', 'regular', 'critica');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.batch_status as enum ('em_producao', 'concluido', 'arquivado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('solicitado', 'em_analise', 'aprovado', 'em_producao', 'entregue', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.packaging_type as enum ('sacola', 'filme', 'embalagem_rigida', 'outro');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. TABELAS
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  role public.user_role not null default 'floricultura',
  status public.user_status not null default 'pending',
  avatar_url text,
  organization_name text not null default '',
  city text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique on public.profiles (lower(email));
create index if not exists profiles_role_status_idx on public.profiles (role, status);

create table if not exists public.petal_collections (
  id uuid primary key default gen_random_uuid(),
  florist_id uuid not null,
  weight_kg numeric(10, 2) not null check (weight_kg > 0),
  quality_status public.petal_quality not null,
  pickup_date date not null,
  status public.collection_status not null default 'solicitada',
  notes text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint petal_collections_florist_id_fkey
    foreign key (florist_id) references public.profiles (id) on delete cascade
);

create index if not exists petal_collections_florist_idx on public.petal_collections (florist_id, created_at desc);
create index if not exists petal_collections_status_idx on public.petal_collections (status);

create table if not exists public.bioplastic_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique,
  collection_id uuid not null,
  researcher_id uuid not null,
  formula_version text not null,
  weight_produced_kg numeric(10, 2) not null check (weight_produced_kg > 0),
  biodegradation_days integer not null check (biodegradation_days > 0),
  tensile_strength numeric(10, 2) not null check (tensile_strength > 0),
  trace_code text not null unique,
  qr_code_url text not null default '',
  evidence_url text,
  status public.batch_status not null default 'concluido',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bioplastic_batches_collection_id_fkey
    foreign key (collection_id) references public.petal_collections (id) on delete restrict,
  constraint bioplastic_batches_researcher_id_fkey
    foreign key (researcher_id) references public.profiles (id) on delete restrict
);

create index if not exists bioplastic_batches_collection_idx on public.bioplastic_batches (collection_id);
create index if not exists bioplastic_batches_researcher_idx on public.bioplastic_batches (researcher_id);
create index if not exists bioplastic_batches_trace_idx on public.bioplastic_batches (trace_code);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  batch_id uuid not null,
  quantity_kg numeric(10, 2) not null check (quantity_kg > 0),
  packaging_type public.packaging_type not null default 'sacola',
  status public.order_status not null default 'solicitado',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_client_id_fkey
    foreign key (client_id) references public.profiles (id) on delete cascade,
  constraint orders_batch_id_fkey
    foreign key (batch_id) references public.bioplastic_batches (id) on delete restrict
);

create index if not exists orders_client_idx on public.orders (client_id, created_at desc);
create index if not exists orders_batch_idx on public.orders (batch_id);
create index if not exists orders_status_idx on public.orders (status);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists petal_collections_set_updated_at on public.petal_collections;
create trigger petal_collections_set_updated_at
  before update on public.petal_collections
  for each row execute function public.set_updated_at();

drop trigger if exists bioplastic_batches_set_updated_at on public.bioplastic_batches;
create trigger bioplastic_batches_set_updated_at
  before update on public.bioplastic_batches
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Cria automaticamente um perfil quando um usuário nasce em auth.users.
-- O papel vem dos metadados, mas nunca permite auto-promoção a SuperAdmin.
-- Toda conta criada publicamente inicia com status "pending" e precisa ser
-- aprovada por um SuperAdmin (exceto quando o backend cria com service role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_text text;
begin
  v_role_text := coalesce(new.raw_user_meta_data ->> 'role', 'floricultura');

  if v_role_text not in ('floricultura', 'comercio_cliente', 'pesquisador_lab') then
    v_role_text := 'floricultura';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    organization_name,
    city,
    role,
    status
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'organization_name', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    v_role_text::public.user_role,
    'pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 4. FUNÇÕES AUXILIARES DE RBAC
-- ============================================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin' and status = 'active'
  );
$$;

create or replace function public.owns_collection(target_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.petal_collections
    where id = target_collection_id and florist_id = auth.uid()
  );
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.petal_collections enable row level security;
alter table public.bioplastic_batches enable row level security;
alter table public.orders enable row level security;

-- ---------------------------- profiles --------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_superadmin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ----------------------- petal_collections ----------------------------------
drop policy if exists "collections_select" on public.petal_collections;
create policy "collections_select"
  on public.petal_collections for select to authenticated
  using (
    florist_id = auth.uid()
    or public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  );

drop policy if exists "collections_insert_florist" on public.petal_collections;
create policy "collections_insert_florist"
  on public.petal_collections for insert to authenticated
  with check (
    florist_id = auth.uid()
    and public.current_user_role() = 'floricultura'
    and public.is_active_user()
    and status = 'solicitada'
  );

drop policy if exists "collections_update_florist" on public.petal_collections;
create policy "collections_update_florist"
  on public.petal_collections for update to authenticated
  using (florist_id = auth.uid() and public.is_active_user())
  with check (florist_id = auth.uid());

drop policy if exists "collections_update_lab_admin" on public.petal_collections;
create policy "collections_update_lab_admin"
  on public.petal_collections for update to authenticated
  using (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  )
  with check (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  );

drop policy if exists "collections_delete_admin" on public.petal_collections;
create policy "collections_delete_admin"
  on public.petal_collections for delete to authenticated
  using (public.is_superadmin());

-- ----------------------- bioplastic_batches ---------------------------------
drop policy if exists "batches_select_active" on public.bioplastic_batches;
create policy "batches_select_active"
  on public.bioplastic_batches for select to authenticated
  using (public.is_active_user());

drop policy if exists "batches_insert_lab_admin" on public.bioplastic_batches;
create policy "batches_insert_lab_admin"
  on public.bioplastic_batches for insert to authenticated
  with check (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  );

drop policy if exists "batches_update_lab_admin" on public.bioplastic_batches;
create policy "batches_update_lab_admin"
  on public.bioplastic_batches for update to authenticated
  using (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  )
  with check (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  );

drop policy if exists "batches_delete_admin" on public.bioplastic_batches;
create policy "batches_delete_admin"
  on public.bioplastic_batches for delete to authenticated
  using (public.is_superadmin());

-- ------------------------------- orders -------------------------------------
drop policy if exists "orders_select" on public.orders;
create policy "orders_select"
  on public.orders for select to authenticated
  using (
    client_id = auth.uid()
    or public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  );

drop policy if exists "orders_insert_client" on public.orders;
create policy "orders_insert_client"
  on public.orders for insert to authenticated
  with check (
    client_id = auth.uid()
    and public.current_user_role() = 'comercio_cliente'
    and public.is_active_user()
    and status = 'solicitado'
  );

drop policy if exists "orders_update_client_cancel" on public.orders;
create policy "orders_update_client_cancel"
  on public.orders for update to authenticated
  using (
    client_id = auth.uid()
    and public.is_active_user()
    and status in ('solicitado', 'em_analise')
  )
  with check (client_id = auth.uid() and status = 'cancelado');

drop policy if exists "orders_update_lab_admin" on public.orders;
create policy "orders_update_lab_admin"
  on public.orders for update to authenticated
  using (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  )
  with check (
    public.is_superadmin()
    or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
  );

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
  on public.orders for delete to authenticated
  using (public.is_superadmin());

-- ============================================================================
-- 6. GRANTS E PROTEÇÃO DE COLUNAS SENSÍVEIS
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, phone, organization_name, city, avatar_url) on public.profiles to authenticated;

grant select, insert, update, delete on public.petal_collections to authenticated;
grant select, insert, update, delete on public.bioplastic_batches to authenticated;
grant select, insert, update, delete on public.orders to authenticated;

-- ============================================================================
-- 7. STORAGE (avatars + evidências de qualidade)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias-lotes',
  'evidencias-lotes',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "evidence_public_read" on storage.objects;
create policy "evidence_public_read"
  on storage.objects for select
  using (bucket_id = 'evidencias-lotes');

drop policy if exists "evidence_lab_insert" on storage.objects;
create policy "evidence_lab_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidencias-lotes'
    and (
      public.is_superadmin()
      or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
    )
  );

drop policy if exists "evidence_lab_update" on storage.objects;
create policy "evidence_lab_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'evidencias-lotes'
    and (
      public.is_superadmin()
      or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
    )
  );

drop policy if exists "evidence_lab_delete" on storage.objects;
create policy "evidence_lab_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidencias-lotes'
    and (
      public.is_superadmin()
      or (public.current_user_role() = 'pesquisador_lab' and public.is_active_user())
    )
  );

-- ============================================================================
-- 8. VIEW PÚBLICA DE RASTREABILIDADE (QR Code "Da Pétala à Embalagem")
--
-- A view expõe apenas dados não sensíveis para leitura anônima. Nomes, e-mails
-- e telefones NÃO são expostos (LGPD). O backend também valida os códigos.
-- ============================================================================

drop view if exists public.public_trace;

create view public.public_trace as
select
  b.trace_code,
  b.batch_code,
  b.formula_version,
  b.weight_produced_kg,
  b.biodegradation_days,
  b.tensile_strength,
  b.status,
  b.created_at,
  p.organization_name as florist_organization,
  p.city as florist_city,
  c.weight_kg as petal_weight_kg,
  c.quality_status,
  c.pickup_date
from public.bioplastic_batches b
join public.petal_collections c on c.id = b.collection_id
join public.profiles p on p.id = c.florist_id;

-- A view roda com os privilégios do owner (postgres) para permitir leitura
-- pública intencional dos campos acima.
alter view public.public_trace set (security_invoker = false);
grant select on public.public_trace to anon, authenticated;

-- ============================================================================
-- 9. PRIMEIRO SUPERADMIN
--
-- Depois de criar sua conta pelo app (que nasce com status "pending"):
--   update public.profiles
--   set role = 'superadmin', status = 'active'
--   where email = 'seu-email@dominio.com';
--
-- Depois disso, o painel SuperAdmin do app aprova as demais contas.
-- ============================================================================
