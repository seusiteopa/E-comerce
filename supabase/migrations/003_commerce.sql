-- ============================================================================
-- Migration 003: Comércio (orders, order_items, payments, coupons, quote_requests, favorites)
-- ============================================================================

create type order_status as enum (
  'aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'
);
create type payment_status as enum (
  'pendente', 'aprovado', 'recusado', 'cancelado', 'reembolsado'
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  address_id uuid references addresses(id), -- nulo se pedido 100% digital/curso/serviço
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_code text,
  status order_status not null default 'aguardando_pagamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_profile_idx on orders(profile_id);
create index orders_status_idx on orders(status);

-- Snapshot de nome/preço no momento da compra (Etapa 3: integridade contábil).
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variation_id uuid references product_variations(id),
  product_name_snapshot text not null,
  product_type_snapshot product_type not null,
  unit_price_snapshot numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);

create index order_items_order_idx on order_items(order_id);

-- payments NUNCA guarda dado de cartão — só status e referência externa (Etapa 2/4).
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  external_reference text, -- ID da transação no Mercado Pago (preenchido na Etapa 10)
  method text, -- pix | cartao | boleto
  amount numeric(10,2) not null,
  status payment_status not null default 'pendente',
  updated_at timestamptz not null default now()
);

create index payments_order_idx on payments(order_id);
create index payments_external_ref_idx on payments(external_reference);

create table coupons (
  code text primary key,
  discount_type text not null check (discount_type in ('percentual', 'fixo')),
  discount_value numeric(10,2) not null,
  scope_category_slug text references categories(slug),
  scope_product_id uuid references products(id),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  usage_limit int,
  usage_limit_per_customer int default 1,
  active boolean not null default true
);

-- Solicitação de orçamento (serviço sob orçamento) — separada de orders (Etapa 3).
create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id), -- nulo se visitante sem conta
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  service_product_id uuid not null references products(id),
  message text not null,
  status text not null default 'novo' check (status in ('novo','em_contato','respondido','encerrado')),
  created_at timestamptz not null default now()
);

create table favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table coupons enable row level security;
alter table quote_requests enable row level security;
alter table favorites enable row level security;

create policy "orders_select_own_or_admin" on orders for select using (
  auth.uid() = profile_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);
create policy "orders_insert_own" on orders for insert with check (auth.uid() = profile_id);
-- Atualização de status é restrita a admin/backend (service role) — cliente não altera status diretamente.
create policy "orders_update_admin_only" on orders for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "order_items_select_own_or_admin" on order_items for select using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and (o.profile_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador'))
  )
);

-- payments: leitura restrita ao dono do pedido ou admin; escrita só via service role (webhook).
create policy "payments_select_own_or_admin" on payments for select using (
  exists (
    select 1 from orders o
    where o.id = payments.order_id
      and (o.profile_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador'))
  )
);

create policy "coupons_public_read_active" on coupons for select using (active = true);
create policy "coupons_admin_write" on coupons for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "quote_requests_insert_any" on quote_requests for insert with check (true);
create policy "quote_requests_select_own_or_admin" on quote_requests for select using (
  auth.uid() = profile_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "favorites_owner_all" on favorites for all using (auth.uid() = profile_id);
