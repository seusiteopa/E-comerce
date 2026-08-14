-- ============================================================================
-- Migration 004: Conteúdo institucional (banners, faq_items, site_settings)
-- ============================================================================

create table banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  title text,
  position text not null default 'principal', -- principal | secundario
  display_order int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz
);

create table faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  topic text not null default 'geral',
  display_order int not null default 0
);

-- Estrutura chave/valor genérica (Etapa 3): evita hardcode de contato/textos no código.
create table site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table banners enable row level security;
alter table faq_items enable row level security;
alter table site_settings enable row level security;

create policy "banners_public_read_active" on banners for select using (active = true);
create policy "banners_admin_write" on banners for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "faq_items_public_read" on faq_items for select using (true);
create policy "faq_items_admin_write" on faq_items for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "site_settings_public_read" on site_settings for select using (true);
create policy "site_settings_admin_write" on site_settings for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);
