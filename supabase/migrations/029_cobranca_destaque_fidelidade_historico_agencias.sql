-- Migração 029: descreve tabelas e funções já criadas no banco nesta fase.
-- Idempotente: pode rodar mais de uma vez. A carga inicial do histórico (preenchimento
-- com vendas antigas) é um passo único e não está aqui.

-- Cobrança da loja: mensalidade, destaque e criação assistida (tipo em "kind").
create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  period_start date not null,
  due_date date not null,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'aberta' check (status in ('aberta','paga','cancelada')),
  pix_payment_id text,
  pix_qr_code text,
  paid_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  kind text not null default 'mensalidade',
  unique (store_id, period_start, kind)
);
alter table public.billing_invoices add column if not exists kind text not null default 'mensalidade';
alter table public.billing_invoices drop constraint if exists billing_invoices_kind_check;
alter table public.billing_invoices add constraint billing_invoices_kind_check check (kind in ('mensalidade','destaque','implantacao'));
alter table public.billing_invoices enable row level security;
drop policy if exists billing_invoices_member_read on public.billing_invoices;
create policy billing_invoices_member_read on public.billing_invoices for select to public using (private.is_store_member(store_id));
drop policy if exists billing_invoices_platform_admin_all on public.billing_invoices;
create policy billing_invoices_platform_admin_all on public.billing_invoices for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());

-- Checkout: carrinho de quem chegou ao pagamento (para o lembrete de 1 hora).
create table if not exists public.checkout_leads (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  cart jsonb not null default '[]'::jsonb,
  status text not null default 'pendente' check (status in ('pendente','concluido','lembrado')),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, email)
);
alter table public.checkout_leads enable row level security;
drop policy if exists checkout_leads_member_read on public.checkout_leads;
create policy checkout_leads_member_read on public.checkout_leads for select to public using (private.is_store_member(store_id));

-- Fidelidade: quem ganhou cada cupom (o cupom só vale para essa pessoa).
create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  paid_order_count integer not null,
  coupon_code text not null,
  created_at timestamptz not null default now(),
  unique (store_id, profile_id, paid_order_count),
  unique (store_id, coupon_code)
);
alter table public.loyalty_rewards enable row level security;
drop policy if exists loyalty_rewards_owner_read on public.loyalty_rewards;
create policy loyalty_rewards_owner_read on public.loyalty_rewards for select to public using (profile_id = auth.uid() or private.is_store_member(store_id));

-- Histórico: vendas aprovadas por dia e por loja.
create table if not exists public.store_daily_metrics (
  store_id uuid not null references public.stores(id) on delete cascade,
  day date not null,
  orders_paid integer not null default 0,
  revenue_cents bigint not null default 0,
  primary key (store_id, day)
);
alter table public.store_daily_metrics enable row level security;
drop policy if exists store_daily_metrics_member_read on public.store_daily_metrics;
create policy store_daily_metrics_member_read on public.store_daily_metrics for select to public using (private.is_store_member(store_id));

create or replace function public.increment_store_metric(p_store_id uuid, p_day date, p_revenue_cents bigint)
returns void language sql security definer set search_path = public as $$
  insert into public.store_daily_metrics (store_id, day, orders_paid, revenue_cents)
  values (p_store_id, p_day, 1, p_revenue_cents)
  on conflict (store_id, day) do update
    set orders_paid = public.store_daily_metrics.orders_paid + 1,
        revenue_cents = public.store_daily_metrics.revenue_cents + excluded.revenue_cents;
$$;
revoke all on function public.increment_store_metric(uuid, date, bigint) from public, anon, authenticated;
grant execute on function public.increment_store_metric(uuid, date, bigint) to service_role;

-- Destaque patrocinado na vitrine (uma linha por loja).
create table if not exists public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  status text not null default 'ativo' check (status in ('ativo','pausado')),
  monthly_fee_cents integer not null default 10000 check (monthly_fee_cents >= 0),
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.sponsorships enable row level security;
drop policy if exists sponsorships_member_read on public.sponsorships;
create policy sponsorships_member_read on public.sponsorships for select to public using (private.is_store_member(store_id));
drop policy if exists sponsorships_platform_admin_all on public.sponsorships;
create policy sponsorships_platform_admin_all on public.sponsorships for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());

-- Agências (revenda): cadastradas pela plataforma; cada loja pode pertencer a uma agência.
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ativo' check (status in ('ativo','suspenso')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
drop policy if exists partners_owner_read on public.partners;
create policy partners_owner_read on public.partners for select to public using (owner_user_id = auth.uid());
drop policy if exists partners_platform_admin_all on public.partners;
create policy partners_platform_admin_all on public.partners for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());

alter table public.stores add column if not exists partner_id uuid references public.partners(id) on delete set null;
create index if not exists stores_partner_id_idx on public.stores(partner_id);
