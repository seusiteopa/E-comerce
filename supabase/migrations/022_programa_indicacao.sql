-- Programa de indicação: cada loja tem um código; quem indica ganha desconto (padrão 20%)
-- na próxima mensalidade, depois que a loja indicada autoriza a assinatura.
-- Aprovado pelo dono da plataforma.
create table public.referral_codes (
  store_id uuid primary key references public.stores(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{6,20}$'),
  created_at timestamptz not null default now()
);
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_store_id uuid not null references public.stores(id) on delete cascade,
  referred_store_id uuid not null unique references public.stores(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','aplicada','cancelada')),
  discount_pct integer not null default 20 check (discount_pct between 0 and 100),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  check (referrer_store_id <> referred_store_id)
);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
create policy referral_codes_member_read on public.referral_codes for select to public using (private.is_store_member(store_id));
create policy referral_codes_member_insert on public.referral_codes for insert to public with check (private.is_store_member(store_id));
create policy referral_codes_platform_admin_all on public.referral_codes for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy referrals_referrer_read on public.referrals for select to public using (private.is_store_member(referrer_store_id));
create policy referrals_platform_admin_all on public.referrals for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
alter table public.store_billing add column if not exists referral_discount_pct integer not null default 0 check (referral_discount_pct between 0 and 100);
