-- Migração 034: pedidos de serviço ligados à conta do cliente, entrega do site (arquivo HTML) e
-- arquivos de mídia (referências enviadas pelo cliente e entregas enviadas pela plataforma).
alter table public.service_briefs
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists site_slug text,
  add column if not exists delivery_html text,
  add column if not exists released_at timestamptz;
create unique index if not exists service_briefs_site_slug_key on public.service_briefs (site_slug) where site_slug is not null;
create index if not exists service_briefs_user_idx on public.service_briefs (user_id, created_at desc);

create table if not exists public.brief_files (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.service_briefs(id) on delete cascade,
  kind text not null check (kind in ('entrega','referencia')),
  url text not null check (char_length(url) <= 600),
  media_type text not null check (media_type in ('imagem','video','arquivo')),
  name text check (name is null or char_length(name) <= 160),
  created_at timestamptz not null default now()
);
create index if not exists brief_files_brief_idx on public.brief_files (brief_id, kind);
alter table public.brief_files enable row level security;
drop policy if exists brief_files_platform_admin_all on public.brief_files;
create policy brief_files_platform_admin_all on public.brief_files for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
