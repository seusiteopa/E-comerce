-- 016 — Base multi-loja (JÁ APLICADA no banco em 12/10/2026; este arquivo registra o que foi aplicado).
-- Aditiva: não remove nada. A loja atual vira a "loja 1" (slug "vecorion").

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  store_type text not null default 'loja' check (store_type in ('loja','restaurante','digital','misto')),
  description text,
  logo_url text,
  og_title text,
  og_description text,
  og_image_url text,
  whatsapp text,
  custom_domain text unique,
  status text not null default 'ativa' check (status in ('ativa','pausada')),
  is_platform_owned boolean not null default false,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'equipe' check (role in ('dono','gerente','equipe')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index store_members_user_idx on public.store_members(user_id);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.store_billing (
  store_id uuid primary key references public.stores(id) on delete cascade,
  plan text not null default 'comissao' check (plan in ('comissao','mensalidade')),
  commission_bps int not null default 100 check (commission_bps between 0 and 10000),
  monthly_fee_cents int check (monthly_fee_cents is null or monthly_fee_cents >= 0),
  billing_status text not null default 'em_dia' check (billing_status in ('em_dia','atrasada')),
  next_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_payment_connections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_user_id text,
  status text not null default 'desconectado' check (status in ('desconectado','conectado','expirado')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create or replace function private.is_store_member(p_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_platform_admin()
     or exists (select 1 from public.store_members where store_id = p_store and user_id = auth.uid());
$$;
grant execute on function private.is_platform_admin() to anon, authenticated;
grant execute on function private.is_store_member(uuid) to anon, authenticated;

insert into public.stores (id, slug, name, store_type, is_platform_owned, owner_id)
values ('00000000-0000-4000-8000-000000000001', 'vecorion', 'Loja Vecorion', 'misto', true,
        (select id from public.profiles where role = 'administrador' order by created_at limit 1));
insert into public.store_billing (store_id, plan, commission_bps) values ('00000000-0000-4000-8000-000000000001', 'comissao', 0);
insert into public.platform_admins (user_id) select id from public.profiles where role = 'administrador';
insert into public.store_members (store_id, user_id, role)
select '00000000-0000-4000-8000-000000000001', id, 'dono' from public.profiles where role = 'administrador';
insert into public.store_payment_connections (store_id, status) values ('00000000-0000-4000-8000-000000000001', 'desconectado');

alter table public.categories add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.products add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.coupons add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.banners add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.faq_items add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.site_settings add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.orders add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);
alter table public.payments add column store_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.stores(id);

create index categories_store_idx on public.categories(store_id);
create index products_store_idx on public.products(store_id);
create index coupons_store_idx on public.coupons(store_id);
create index banners_store_idx on public.banners(store_id);
create index faq_items_store_idx on public.faq_items(store_id);
create index site_settings_store_idx on public.site_settings(store_id);
create index orders_store_idx on public.orders(store_id);
create index payments_store_idx on public.payments(store_id);

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.store_billing enable row level security;
alter table public.store_payment_connections enable row level security;

create policy stores_public_read on public.stores for select using (true);
create policy stores_member_update on public.stores for update using (private.is_store_member(id)) with check (private.is_store_member(id));
create policy stores_platform_admin_all on public.stores for all using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy store_members_read on public.store_members for select using (user_id = auth.uid() or private.is_store_member(store_id));
create policy store_members_platform_admin_all on public.store_members for all using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy store_billing_member_read on public.store_billing for select using (private.is_store_member(store_id));
create policy store_billing_platform_admin_all on public.store_billing for all using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy platform_admins_self_read on public.platform_admins for select using (user_id = auth.uid());
-- store_payment_connections: sem policies (somente backend com chave de serviço)

create policy categories_store_member on public.categories for all using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy products_store_member on public.products for all using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy coupons_store_member on public.coupons for all using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy banners_store_member on public.banners for all using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy faq_items_store_member on public.faq_items for all using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy site_settings_store_member on public.site_settings for all using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy product_images_store_member on public.product_images for all
  using (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));
create policy product_variations_store_member on public.product_variations for all
  using (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));
create policy digital_assets_store_member on public.digital_assets for all
  using (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));
create policy orders_store_member_read on public.orders for select using (private.is_store_member(store_id));
create policy orders_store_member_update on public.orders for update using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy order_items_store_member_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and private.is_store_member(o.store_id)));
create policy payments_store_member_read on public.payments for select using (private.is_store_member(store_id));
