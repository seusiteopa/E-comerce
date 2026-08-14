-- ============================================================================
-- Migration 006: Suporte às automações de pagamento (Etapa 10)
--   1) payer_email em orders (necessário para o e-mail transacional e para
--      o campo `payer.email` exigido pelo Mercado Pago ao criar a preferência)
--   2) Função RPC de decremento de estoque atômico e seguro contra concorrência
-- ============================================================================

alter table orders add column payer_email text;

-- Decremento atômico: evita condição de corrida entre dois pagamentos
-- aprovados quase simultaneamente para a mesma variação (o `where stock >=
-- amount` garante que o estoque nunca fica negativo, mesmo sob concorrência).
create function decrement_variation_stock(variation_id uuid, amount int)
returns void as $$
begin
  update product_variations
  set stock = stock - amount
  where id = variation_id and stock >= amount;

  if not found then
    raise warning 'Estoque insuficiente ou variação % não encontrada ao decrementar %', variation_id, amount;
  end if;
end;
$$ language plpgsql security definer;
