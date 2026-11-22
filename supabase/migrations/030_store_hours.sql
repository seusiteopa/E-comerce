-- Migração 030: horário de funcionamento por dia da semana (0 = domingo).
-- Sem linhas para a loja = aberta sempre. Idempotente.
create table if not exists public.store_hours (
  store_id uuid not null references public.stores(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  closed boolean not null default false,
  opens_at time,
  closes_at time,
  primary key (store_id, weekday),
  check (closed or (opens_at is not null and closes_at is not null))
);
alter table public.store_hours enable row level security;
drop policy if exists store_hours_member_read on public.store_hours;
create policy store_hours_member_read on public.store_hours for select to public using (private.is_store_member(store_id));
drop policy if exists store_hours_platform_admin_all on public.store_hours;
create policy store_hours_platform_admin_all on public.store_hours for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
