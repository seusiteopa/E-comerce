-- ============================================================================
-- Migration 005: Ajustes para integrações (Etapa 10)
--   1) Controle de liberação de acesso a curso (lacuna identificada na Etapa 9)
--   2) Registro de eventos de webhook processados (idempotência — Etapa 4/7/9)
-- ============================================================================

alter table order_items
  add column course_access_released boolean not null default false,
  add column course_access_released_at timestamptz;

-- Fila "Cursos Pendentes" do admin (Etapa 5) consulta itens de curso pagos e
-- ainda não liberados — índice parcial para essa consulta ser rápida mesmo
-- com o crescimento da tabela.
create index order_items_course_pending_idx
  on order_items(product_type_snapshot, course_access_released)
  where product_type_snapshot = 'curso' and course_access_released = false;

-- Idempotência de webhook: o Mercado Pago pode reenviar a mesma notificação
-- mais de uma vez (Etapa 4/7/9) — cada evento processado é registrado aqui
-- antes de aplicar qualquer efeito colateral (decremento de estoque, e-mail).
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null, -- 'mercadopago'
  external_event_id text not null,
  processed_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

alter table order_items enable row level security;
-- (RLS de order_items já existente na migration 003 cobre select; sem
-- necessidade de nova policy aqui, pois a escrita desta coluna é feita
-- exclusivamente via service role, que ignora RLS por definição.)

alter table webhook_events enable row level security;
-- Sem policy de leitura pública nem de cliente — só o service role escreve
-- e lê esta tabela; nenhuma policy = acesso negado por padrão para
-- usuários autenticados comuns, que é exatamente o comportamento desejado.
