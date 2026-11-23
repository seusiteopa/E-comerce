-- Migração 031: opções de produto, estoque por combinação (usa product_variations),
-- aulas de curso, pedidos de encerramento/exclusão e tipos de loja (curso).
-- Idempotente: pode rodar mais de uma vez.

-- Opções de produto (grupos e opções com valor extra).
create table if not exists public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  mode text not null default 'escolha' check (mode in ('escolha','multipla')),
  required boolean not null default false,
  min_choices integer not null default 0 check (min_choices >= 0),
  max_choices integer check (max_choices is null or max_choices >= 0),
  stock_tracked boolean not null default false,
  position integer not null default 0
);
create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.product_option_groups(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  extra_price numeric(10,2) not null default 0 check (extra_price >= 0),
  position integer not null default 0
);
alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;
drop policy if exists product_option_groups_read on public.product_option_groups;
create policy product_option_groups_read on public.product_option_groups for select to public using (true);
drop policy if exists product_options_read on public.product_options;
create policy product_options_read on public.product_options for select to public using (true);
drop policy if exists product_option_groups_member_write on public.product_option_groups;
create policy product_option_groups_member_write on public.product_option_groups for all to public using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
drop policy if exists product_options_member_write on public.product_options;
create policy product_options_member_write on public.product_options for all to public using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));

-- Aulas de curso (link do YouTube não listado ou Vimeo).
create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  video_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.course_lessons enable row level security;
drop policy if exists course_lessons_member_all on public.course_lessons;
create policy course_lessons_member_all on public.course_lessons for all to public using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));

-- Pedidos da loja: encerrar (aviso) e excluir (aprovação da plataforma).
create table if not exists public.store_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('encerrada','exclusao')),
  status text not null default 'pendente' check (status in ('pendente','aprovada','recusada','concluida')),
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.store_requests enable row level security;
drop policy if exists store_requests_member_read on public.store_requests;
create policy store_requests_member_read on public.store_requests for select to public using (private.is_store_member(store_id));
drop policy if exists store_requests_platform_admin_all on public.store_requests;
create policy store_requests_platform_admin_all on public.store_requests for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());

-- Tipos de loja: acrescenta "curso" (mantém os existentes para as lojas já criadas).
alter table public.stores drop constraint if exists stores_store_type_check;
alter table public.stores add constraint stores_store_type_check check (store_type = any (array['loja'::text, 'restaurante'::text, 'digital'::text, 'misto'::text, 'curso'::text]));
