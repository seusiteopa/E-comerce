-- ============================================================================
-- Migration 009: coluna "hidden" em products (produtos exclusivos / oferta)
--
-- Esta coluna já existia fisicamente no banco de produção (adicionada fora
-- do fluxo de migrations, provavelmente direto pelo painel do Supabase, como
-- parte do recurso de "produto exclusivo" / página /oferta/[slug]), mas
-- nunca tinha sido registrada aqui. Registrando agora para que o schema
-- do banco fique reproduzível a partir do zero só com as migrations.
--
-- Produto "hidden = true" não aparece no catálogo público (getActiveProducts,
-- getFeaturedProducts, getProductsByCategory, searchProducts filtram por
-- hidden = false), mas continua acessível diretamente pela URL /oferta/[slug]
-- — uso típico de oferta exclusiva enviada por link, sem listagem pública.
-- ============================================================================

alter table products
  add column if not exists hidden boolean not null default false;
