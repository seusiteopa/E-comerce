-- Dono/membro da loja pode ler os perfis de quem comprou nela (tela Clientes do painel).
-- Aplicada em produção após aprovação do dono da plataforma. Não libera perfis de outras pessoas.
create policy profiles_store_member_read on public.profiles for select to public
  using (exists (select 1 from public.orders o where o.profile_id = profiles.id and private.is_store_member(o.store_id)));
