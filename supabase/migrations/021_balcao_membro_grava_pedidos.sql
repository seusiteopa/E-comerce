-- Dono/membro da loja pode criar pedidos, itens e pagamentos da PRÓPRIA loja (pedido de balcão).
-- Não libera nada de outras lojas. Aprovada pelo dono da plataforma (item 2 da lista de permissões).
create policy orders_store_member_insert on public.orders for insert to public
  with check (private.is_store_member(store_id));
create policy payments_store_member_insert on public.payments for insert to public
  with check (private.is_store_member(store_id));
create policy order_items_store_member_all on public.order_items for all to public
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and private.is_store_member(o.store_id)))
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and private.is_store_member(o.store_id)));
