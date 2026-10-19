-- Limite de tentativas (login, cupom, oferta, frete). Só o servidor acessa a tabela.
create table public.rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
create or replace function public.rate_limit_hit(p_bucket text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits integer; v_start timestamptz;
begin
  insert into public.rate_limits as r (bucket, hits, window_start) values (p_bucket, 1, now())
  on conflict (bucket) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits, window_start into v_hits, v_start;
  return v_hits <= p_max;
end; $$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
