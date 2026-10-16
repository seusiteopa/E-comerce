-- 017 — Unicidade por loja (NÃO APLICADA ainda).
-- Aplicar SOMENTE depois de publicar o código novo (Fase B), porque:
--  * o código antigo faz upsert em site_settings por "key" e insere sem store_id;
--  * aqui as chaves passam a ser por loja e o valor padrão de store_id é removido.

-- Categorias: (store_id, slug) em vez de só slug
alter table public.categories drop constraint categories_parent_slug_fkey;
alter table public.products drop constraint products_category_slug_fkey;
alter table public.coupons drop constraint coupons_scope_category_slug_fkey;
alter table public.categories drop constraint categories_pkey;
alter table public.categories add constraint categories_pkey primary key (store_id, slug);

alter table public.categories add constraint categories_parent_fkey
  foreign key (store_id, parent_slug) references public.categories (store_id, slug) on delete set null (parent_slug);
alter table public.products add constraint products_category_fkey
  foreign key (store_id, category_slug) references public.categories (store_id, slug);
alter table public.coupons add constraint coupons_scope_category_fkey
  foreign key (store_id, scope_category_slug) references public.categories (store_id, slug);

-- Produtos: slug único dentro da loja
alter table public.products drop constraint products_slug_key;
alter table public.products add constraint products_store_slug_key unique (store_id, slug);

-- Cupons e configurações: chave por loja
alter table public.coupons drop constraint coupons_pkey;
alter table public.coupons add constraint coupons_pkey primary key (store_id, code);
alter table public.site_settings drop constraint site_settings_pkey;
alter table public.site_settings add constraint site_settings_pkey primary key (store_id, key);

-- Fim do "valor padrão = loja 1": toda gravação precisa informar a loja explicitamente
alter table public.categories alter column store_id drop default;
alter table public.products alter column store_id drop default;
alter table public.coupons alter column store_id drop default;
alter table public.banners alter column store_id drop default;
alter table public.faq_items alter column store_id drop default;
alter table public.site_settings alter column store_id drop default;
alter table public.orders alter column store_id drop default;
alter table public.payments alter column store_id drop default;
