-- ============================================================================
-- Migration 013: política de RLS em storage.objects para o bucket privado
-- "produtos-digitais".
--
-- O bucket foi criado (fora de migration, direto pelo painel/via SQL) como
-- privado, mas nenhuma política de RLS jamais foi definida em
-- storage.objects para ele. Mesmo usando uma URL assinada de upload
-- (createSignedUploadUrl), a gravação real na tabela storage.objects ainda
-- passa pelo RLS — sem nenhuma política permissiva, o upload falhava
-- (no navegador, aparecendo como erro genérico "Failed to fetch", já que
-- a resposta de erro do Storage não carrega cabeçalho CORS).
-- ============================================================================

create policy "produtos_digitais_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'produtos-digitais' and public.is_admin())
with check (bucket_id = 'produtos-digitais' and public.is_admin());
