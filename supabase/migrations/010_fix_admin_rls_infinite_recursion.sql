-- ============================================================================
-- Migration 010: corrige recursão infinita nas políticas de RLS que checavam
-- "é administrador" fazendo SELECT na própria tabela profiles.
--
-- Problema: profiles_select_own_or_admin (e ~18 outras políticas em outras
-- tabelas) faziam `exists (select 1 from profiles p where p.id = auth.uid()
-- and p.role = 'administrador')`. Como profiles tem RLS habilitado, essa
-- subquery reaciona a MESMA política, causando recursão infinita
-- ("infinite recursion detected in policy for relation profiles"), o que
-- travava qualquer consulta que dependesse de checar o papel de admin —
-- inclusive o acesso ao /admin do site (ficava "carregando" sem terminar).
--
-- Solução: função security definer que lê o papel do usuário ignorando RLS
-- (sem re-acionar a política), usada no lugar da subquery recursiva.
--
-- Nota: esta migration formaliza uma correção que já foi aplicada
-- diretamente em produção (banco vecorion-loja) para resolver o bug com
-- urgência. Rodar aqui garante que qualquer banco novo criado a partir do
-- zero, a partir das migrations, já nasça sem o problema.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'administrador'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- 001_identity.sql
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "addresses_select_own_or_admin" on addresses;
create policy "addresses_select_own_or_admin"
  on addresses for select
  using (auth.uid() = profile_id or public.is_admin());

-- 002_catalog.sql
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories for all using (public.is_admin());

drop policy if exists "products_admin_all" on products;
create policy "products_admin_all" on products for all using (public.is_admin());

drop policy if exists "product_images_admin_write" on product_images;
create policy "product_images_admin_write" on product_images for all using (public.is_admin());

drop policy if exists "product_variations_admin_write" on product_variations;
create policy "product_variations_admin_write" on product_variations for all using (public.is_admin());

drop policy if exists "digital_assets_admin_only" on digital_assets;
create policy "digital_assets_admin_only" on digital_assets for all using (public.is_admin());

drop policy if exists "course_links_admin_write" on course_links;
create policy "course_links_admin_write" on course_links for all using (public.is_admin());

drop policy if exists "service_details_admin_write" on service_details;
create policy "service_details_admin_write" on service_details for all using (public.is_admin());

-- 003_commerce.sql
drop policy if exists "orders_select_own_or_admin" on orders;
create policy "orders_select_own_or_admin" on orders for select using (
  auth.uid() = profile_id or public.is_admin()
);

drop policy if exists "orders_update_admin_only" on orders;
create policy "orders_update_admin_only" on orders for update using (public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on order_items;
create policy "order_items_select_own_or_admin" on order_items for select using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and (o.profile_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "payments_select_own_or_admin" on payments;
create policy "payments_select_own_or_admin" on payments for select using (
  exists (
    select 1 from orders o
    where o.id = payments.order_id
      and (o.profile_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "coupons_admin_write" on coupons;
create policy "coupons_admin_write" on coupons for all using (public.is_admin());

drop policy if exists "quote_requests_select_own_or_admin" on quote_requests;
create policy "quote_requests_select_own_or_admin" on quote_requests for select using (
  auth.uid() = profile_id or public.is_admin()
);

-- 004_content.sql
drop policy if exists "banners_admin_write" on banners;
create policy "banners_admin_write" on banners for all using (public.is_admin());

drop policy if exists "faq_items_admin_write" on faq_items;
create policy "faq_items_admin_write" on faq_items for all using (public.is_admin());

drop policy if exists "site_settings_admin_write" on site_settings;
create policy "site_settings_admin_write" on site_settings for all using (public.is_admin());

-- 008_quote_requests_admin_update.sql
drop policy if exists "quote_requests_update_admin_only" on quote_requests;
create policy "quote_requests_update_admin_only" on quote_requests for update using (public.is_admin());
