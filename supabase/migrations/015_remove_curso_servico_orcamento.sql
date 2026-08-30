-- ============================================================================
-- Migration 015: remove por completo as funcionalidades de "curso" e
-- "serviço" (produto e categoria) e "orçamento" (quote_requests).
--
-- Decisão do dono da loja: manter o site só com produtos físicos e
-- digitais, sem misturar com curso/serviço/orçamento sob medida.
-- Nenhum produto nem orçamento existia cadastrado nesses tipos no momento
-- da remoção (checado antes de aplicar).
-- ============================================================================

drop table if exists quote_requests cascade;
drop table if exists course_links cascade;
drop table if exists service_details cascade;

delete from categories where product_type in ('curso', 'servico');
