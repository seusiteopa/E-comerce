-- 018 — Mercado Pago por loja (OAuth), assinatura recorrente da mensalidade, pedido de balcão,
--       app de impressão por loja. Aditiva e compatível com o código anterior.

-- Pedido de balcão: sem cliente cadastrado e com canal de origem.
alter table public.orders alter column profile_id drop not null;
alter table public.orders add column if not exists channel text not null default 'online' check (channel in ('online','balcao'));
alter table public.orders add column if not exists customer_name text;
create index if not exists orders_channel_idx on public.orders(store_id, channel);

-- App de impressão térmica escolhido pelo lojista.
alter table public.stores add column if not exists printer_app text not null default 'thermer' check (printer_app in ('thermer','rawbt'));

-- Assinatura recorrente (mensalidade) no Mercado Pago da plataforma.
alter table public.store_billing add column if not exists subscription_status text not null default 'sem_assinatura'
  check (subscription_status in ('sem_assinatura','pendente','em_teste','ativa','pausada','cancelada'));
alter table public.store_billing add column if not exists mp_preapproval_id text;
alter table public.store_billing add column if not exists trial_ends_at timestamptz;
alter table public.store_billing add column if not exists last_payment_at timestamptz;
alter table public.store_billing add column if not exists last_notice_at timestamptz;
alter table public.store_billing add column if not exists payer_email text;
create unique index if not exists store_billing_preapproval_uidx on public.store_billing(mp_preapproval_id) where mp_preapproval_id is not null;

-- Estados temporários do fluxo OAuth (proteção contra CSRF). Só o backend (chave de serviço) acessa.
create table if not exists public.oauth_states (
  state text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.oauth_states enable row level security;
