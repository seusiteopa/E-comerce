-- ============================================================================
-- Migration 008: Fecha o achado crítico da auditoria da Etapa 13 —
-- quote_requests não tinha policy de UPDATE, então o admin nunca
-- conseguiria mudar o status de uma solicitação de orçamento
-- (novo → em_contato → respondido → encerrado).
-- ============================================================================

create policy "quote_requests_update_admin_only" on quote_requests for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'administrador')
);
