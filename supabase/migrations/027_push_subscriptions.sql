-- Aparelhos que aceitaram notificação de pedido. Dono/membro da loja vê e altera só os próprios.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy push_subscriptions_owner_all on public.push_subscriptions for all to public
  using (profile_id = auth.uid() and private.is_store_member(store_id))
  with check (profile_id = auth.uid() and private.is_store_member(store_id));
