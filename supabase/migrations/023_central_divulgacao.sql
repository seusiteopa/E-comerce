-- Central de divulgação (Etapa 8): briefings de divulgação e campanhas geradas, por loja.
-- Cada loja enxerga apenas os próprios registros. Aprovado pelo dono da plataforma.
create table public.marketing_briefs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null check (length(title) between 2 and 120),
  audience text not null default '',
  tone text not null default '',
  format text not null default 'post' check (format in ('post','story','anuncio')),
  notes text not null default '',
  status text not null default 'rascunho' check (status in ('rascunho','pronto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  brief_id uuid references public.marketing_briefs(id) on delete set null,
  kind text not null default 'imagem' check (kind in ('imagem','texto')),
  content text not null default '',
  image_url text,
  status text not null default 'gerada' check (status in ('gerada','erro')),
  created_at timestamptz not null default now()
);
alter table public.marketing_briefs enable row level security;
alter table public.marketing_campaigns enable row level security;
create policy marketing_briefs_member_all on public.marketing_briefs for all to public using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy marketing_briefs_platform_admin_all on public.marketing_briefs for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy marketing_campaigns_member_all on public.marketing_campaigns for all to public using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy marketing_campaigns_platform_admin_all on public.marketing_campaigns for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
