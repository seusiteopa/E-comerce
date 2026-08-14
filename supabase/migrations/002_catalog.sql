-- ============================================================================
-- Migration 002: Catálogo (categories, products, complementos por tipo)
-- ============================================================================

create type product_type as enum ('fisico', 'digital', 'curso', 'servico');
create type product_status as enum ('ativo', 'inativo', 'rascunho');

create table categories (
  slug text primary key,
  name text not null,
  description text,
  product_type product_type not null,
  parent_slug text references categories(slug) on delete set null,
  display_order int not null default 0,
  active boolean not null default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type product_type not null,
  category_slug text not null references categories(slug),
  short_description text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price < price),
  status product_status not null default 'rascunho',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on products(category_slug);
create index products_type_idx on products(type);
create index products_status_idx on products(status);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text not null default '',
  display_order int not null default 0
);

-- Produto físico: variação (atributo/valor genérico — Etapa 3, evita travar em só tamanho/cor)
create table product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  attributes jsonb not null default '{}', -- ex: {"tamanho": "M", "cor": "Azul"}
  stock int not null default 0 check (stock >= 0),
  sku text unique not null,
  weight_grams int,
  width_cm numeric(6,2),
  height_cm numeric(6,2),
  length_cm numeric(6,2)
);

create index product_variations_product_idx on product_variations(product_id);

-- Produto digital: referência de entrega (nunca em bucket público — Etapa 3)
create table digital_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null, -- caminho privado no Supabase Storage
  delivery_type text not null default 'download', -- download | link_expiravel | licenca
  download_limit int -- null = sem limite
);

-- Curso: referência externa à Vecorion Cursos (sem API real ainda — Etapa 1/4)
create table course_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  external_course_reference text not null, -- slug/identificador do curso na Vecorion Cursos
  level text,
  modules int
);

-- Serviço: benefícios inclusos + flag de "sob orçamento"
create table service_details (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  includes text[] not null default '{}',
  is_quote_only boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Row Level Security — catálogo é de leitura pública (itens ativos), escrita só admin
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variations enable row level security;
alter table digital_assets enable row level security;
alter table course_links enable row level security;
alter table service_details enable row level security;

create policy "categories_public_read" on categories for select using (active = true);
create policy "categories_admin_write" on categories for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "products_public_read" on products for select using (status = 'ativo');
create policy "products_admin_all" on products for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "product_images_public_read" on product_images for select using (true);
create policy "product_images_admin_write" on product_images for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "product_variations_public_read" on product_variations for select using (true);
create policy "product_variations_admin_write" on product_variations for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

-- digital_assets NÃO é de leitura pública — só admin e o backend (via service role) acessam;
-- a entrega ao cliente acontece por link assinado gerado sob demanda, nunca leitura direta da tabela.
create policy "digital_assets_admin_only" on digital_assets for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "course_links_public_read" on course_links for select using (true);
create policy "course_links_admin_write" on course_links for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);

create policy "service_details_public_read" on service_details for select using (true);
create policy "service_details_admin_write" on service_details for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);
