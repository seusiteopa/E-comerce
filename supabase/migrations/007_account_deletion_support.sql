-- ============================================================================
-- Migration 007: Permite exclusão de conta preservando histórico de pedidos
-- (Etapa 13 — bug encontrado durante a implementação da exclusão de conta
-- por LGPD: orders.profile_id não tinha `on delete set null`, o que faria
-- a exclusão de qualquer cliente com pedidos falhar por violação de FK)
-- ============================================================================

alter table orders alter column profile_id drop not null;
alter table orders drop constraint orders_profile_id_fkey;
alter table orders
  add constraint orders_profile_id_fkey
  foreign key (profile_id) references profiles(id) on delete set null;
