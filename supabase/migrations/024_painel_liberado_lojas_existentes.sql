-- Lojas que já existiam antes da regra de assinatura ficam liberadas para o painel
-- (decisão do dono da plataforma). Lojas novas seguem a regra de autorização da mensalidade.
alter table public.store_billing add column if not exists painel_liberado boolean not null default false;
update public.store_billing sb set painel_liberado = true
  from public.stores s
  where s.id = sb.store_id and s.slug in ('lanche','dtbb','pama-kakis','sativo');
