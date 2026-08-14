-- ============================================================================
-- Migration 001: Identidade (profiles, addresses)
-- Etapa 3 (modelagem) + Etapa 9 (formalização em SQL)
-- ============================================================================

create type user_role as enum ('cliente', 'administrador');

-- profiles estende o usuário do Supabase Auth (auth.users) com dados de negócio.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  document text, -- CPF/CNPJ, opcional nesta fase (sem emissão fiscal — Etapa 1)
  role user_role not null default 'cliente',
  created_at timestamptz not null default now()
);

-- Criado automaticamente quando um usuário completa o cadastro no checkout
-- (login não é pré-requisito para navegar — decisão da Etapa 1).
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'cliente');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Principal',
  zip_code text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_profile_id_idx on addresses(profile_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table addresses enable row level security;

-- profiles: cada pessoa só lê/edita o próprio perfil; admin lê todos.
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (auth.uid() = id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador'
  ));

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- addresses: mesma regra — dono ou admin.
create policy "addresses_select_own_or_admin"
  on addresses for select
  using (auth.uid() = profile_id or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador'
  ));

create policy "addresses_insert_own"
  on addresses for insert
  with check (auth.uid() = profile_id);

create policy "addresses_update_own"
  on addresses for update
  using (auth.uid() = profile_id);

create policy "addresses_delete_own"
  on addresses for delete
  using (auth.uid() = profile_id);
