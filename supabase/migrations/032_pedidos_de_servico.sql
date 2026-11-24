-- Migração 032: pedidos de serviço feitos na página inicial da plataforma
-- (site personalizado, imagens e banners, vídeos). Sem login: a pessoa envia nome e contato.
-- Só a plataforma lê e atualiza. Idempotente.
create table if not exists public.service_briefs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('site','imagens','videos')),
  name text not null check (char_length(name) between 2 and 120),
  whatsapp text not null check (char_length(whatsapp) between 10 and 15),
  email text check (email is null or char_length(email) <= 160),
  business text check (business is null or char_length(business) <= 120),
  description text not null check (char_length(description) between 10 and 2000),
  references_text text check (references_text is null or char_length(references_text) <= 1000),
  deadline text check (deadline is null or char_length(deadline) <= 80),
  status text not null default 'novo' check (status in ('novo','em_atendimento','concluido')),
  created_at timestamptz not null default now()
);
create index if not exists service_briefs_status_created_idx on public.service_briefs (status, created_at desc);
alter table public.service_briefs enable row level security;
drop policy if exists service_briefs_platform_admin_all on public.service_briefs;
create policy service_briefs_platform_admin_all on public.service_briefs for all to public using (private.is_platform_admin()) with check (private.is_platform_admin());
