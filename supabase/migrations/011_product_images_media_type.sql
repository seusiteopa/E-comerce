-- ============================================================================
-- Migration 011: suporte a vídeo em product_images (hospedado no Cloudinary)
--
-- Até aqui, product_images só guardava fotos. Adiciona uma coluna
-- media_type para diferenciar imagem de vídeo, permitindo anexar um vídeo
-- de produto (também hospedado no Cloudinary) na mesma tabela.
-- ============================================================================

alter table product_images
  add column if not exists media_type text not null default 'imagem'
  check (media_type in ('imagem', 'video'));
