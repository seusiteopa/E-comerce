-- Dono/membro da loja pode atualizar o pagamento dos pedidos de balcão da PRÓPRIA loja
-- (registro do identificador do Pix). Aprovado pelo dono da plataforma (item 3).
create policy payments_store_member_update on public.payments for update to public
  using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
