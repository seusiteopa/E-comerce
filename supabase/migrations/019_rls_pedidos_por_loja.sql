-- 019: RLS de pedidos verifica a loja informada.
--
-- Antes: "orders_insert_own" checava só auth.uid() = profile_id, então um cliente
-- podia criar pedido vinculado a qualquer store_id.
-- Agora: o pedido só pode ser inserido pelo próprio cliente e apenas para uma
-- loja que existe. O checkout (src/actions/checkout.ts) já envia store_id e
-- usa o cliente do usuário, então continua funcionando.

drop policy if exists "orders_insert_own" on public.orders;

create policy "orders_insert_own"
  on public.orders for insert
  with check (
    auth.uid() = profile_id
    and exists (select 1 from public.stores s where s.id = store_id)
  );

-- Documentação: o administrador da plataforma (role 'administrador', via is_admin())
-- tem acesso global, em todas as lojas. Isso é intencional e foi mantido das
-- migrações 002/010. Qualquer mudança nessa regra deve ser discutida antes.
comment on function public.is_admin() is
  'Administrador global da plataforma (role administrador). Acesso a todas as lojas. Intencional.';
