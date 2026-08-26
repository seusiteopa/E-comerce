-- ============================================================================
-- Migration 012: media_type em banners (suporte a vídeo, além de imagem)
-- ============================================================================

alter table banners
  add column if not exists media_type text not null default 'imagem'
  check (media_type in ('imagem', 'video'));
