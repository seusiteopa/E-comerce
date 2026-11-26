-- Migração 033: exclusão completa de uma loja pelo dono da plataforma, em uma única transação.
-- Apaga primeiro o que bloqueia a exclusão (cupons, pedidos, produtos, categorias, banners, perguntas
-- frequentes e configurações) e depois a loja; o restante some em cascata. Nunca apaga a loja da plataforma.
create or replace function public.platform_delete_store(p_store_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if exists (select 1 from public.stores where id = p_store_id and is_platform_owned) then
    raise exception 'A loja da plataforma não pode ser excluída.';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'Loja não encontrada.';
  end if;
  delete from public.coupons where store_id = p_store_id;
  delete from public.orders where store_id = p_store_id;
  delete from public.products where store_id = p_store_id;
  delete from public.categories where store_id = p_store_id;
  delete from public.banners where store_id = p_store_id;
  delete from public.faq_items where store_id = p_store_id;
  delete from public.site_settings where store_id = p_store_id;
  delete from public.stores where id = p_store_id;
end;
$$;
revoke all on function public.platform_delete_store(uuid) from public, anon, authenticated;
grant execute on function public.platform_delete_store(uuid) to service_role;
