-- Entrega local ou para todo o Brasil, com a cidade-base e as cidades atendidas.
alter table public.stores
  add column if not exists delivery_scope text not null default 'brasil' check (delivery_scope in ('local','brasil')),
  add column if not exists delivery_base_city text,
  add column if not exists delivery_cities text[] not null default '{}';
