# Plataforma multi-loja Vecorion — estado, configuração e ordem de publicação

## Como a loja é identificada
Pelo endereço da requisição (nunca por campo enviado pelo navegador):
1. `subdominio.PLATFORM_ROOT_DOMAIN` → loja com `stores.slug = subdominio`
2. domínio próprio → `stores.custom_domain`
3. localhost / `*.netlify.app` / desconhecido → loja padrão (`DEFAULT_STORE_SLUG`, padrão `vecorion`)

## Variáveis de ambiente (Netlify → Environment variables)
Já existiam (não mexer): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN` (conta da plataforma), `MERCADOPAGO_WEBHOOK_SECRET`, Cloudinary, Brevo.

Novas:
| Variável | Para quê |
|---|---|
| `PLATFORM_ROOT_DOMAIN` | ex.: `vecorion.com.br` — ativa `loja.vecorion.com.br` por loja (precisa de DNS curinga `*.vecorion.com.br` apontando para o Netlify) |
| `DEFAULT_STORE_SLUG` | opcional, padrão `vecorion` |
| `MP_CLIENT_ID` | Client ID do aplicativo Mercado Pago (OAuth) |
| `MP_CLIENT_SECRET` | Client Secret do aplicativo — **só na Netlify, nunca no chat/GitHub** |
| `MP_OAUTH_REDIRECT_URI` | opcional; padrão `NEXT_PUBLIC_SITE_URL/api/mercadopago/oauth/callback` |
| `TOKEN_ENCRYPTION_KEY` | chave que criptografa os tokens das lojas no banco. Gere com `openssl rand -base64 32` e **guarde uma cópia**: se perder, os lojistas precisam reconectar |
| `PLATFORM_MONTHLY_FEE` | valor da mensalidade em reais (ex.: `49,90`). Sem isso a opção "mensalidade" some do cadastro |

## Configuração no painel do Mercado Pago (aplicativo da Vecorion)
1. **Redirect URL (OAuth):** cadastre exatamente `https://SEU-DOMINIO-CENTRAL/api/mercadopago/oauth/callback` (o mesmo de `NEXT_PUBLIC_SITE_URL`).
2. **Webhooks → URL:** `https://SEU-DOMINIO-CENTRAL/api/webhooks/mercadopago`. Marque os tópicos **Pagamentos** e **Planos e assinaturas** (assinatura, pagamento recorrente). O segredo gerado é o `MERCADOPAGO_WEBHOOK_SECRET`.
3. Ative o aplicativo para ser usado por outros vendedores (OAuth/marketplace), se o painel pedir.

## Como funciona o dinheiro
- **Venda do cliente final:** cada lojista conecta a própria conta Mercado Pago (botão em *Admin → Pagamentos e plano*, via OAuth, sem copiar senhas). O pagamento é criado com o token do lojista; o dinheiro cai direto na conta dele. Plano **comissão**: a Vecorion recebe 1% por venda (campo `application_fee` no Pix, `marketplace_fee` no cartão/Checkout Pro). Plano **mensalidade**: sem comissão.
- **Loja da plataforma (`is_platform_owned`)** continua usando `MERCADOPAGO_ACCESS_TOKEN`, sem comissão.
- **Mensalidade:** assinatura recorrente (API `preapproval`) na conta Mercado Pago da plataforma. **Primeiro mês grátis**; no cadastro o lojista é levado ao banco/Mercado Pago para autorizar as cobranças seguintes; o mês conta a partir da assinatura. Depois cobra todo mês automaticamente.
- **Atraso NÃO pausa a loja.** O sistema marca "atrasada" e avisa o lojista por e-mail; só você pausa/libera, no painel `/plataforma`.
- Tokens dos lojistas ficam **criptografados** (AES-256-GCM) no banco e são renovados automaticamente antes de vencer.

## Telas novas
- `/criar-loja` — cadastro de loja nova (escolhe comissão ou mensalidade).
- `/plataforma` — painel do dono da plataforma: lojas, plano, situação da mensalidade, Mercado Pago conectado, vendas; pausar/liberar e marcar em dia/atrasada.
- `/admin/pagamentos` — conectar/desconectar Mercado Pago, ver plano e autorizar a mensalidade.
- `/admin/loja` — nome, logo, **imagem de prévia do link (OG)**, WhatsApp e **app de impressão (Thermer ou RawBT)**.
- `/admin/balcao` — pedido de balcão: Pix (QR Code, confirma sozinho), dinheiro ou cartão (maquininha própria).
- `/admin/pedidos` — botão **Imprimir** (abre o app escolhido) e marcação de pedidos de balcão.
- Cadastro de produto: **ícones prontos** (46, em `public/icones`) para quem não tem foto.

## Banco
Migrações `016` e `018` já aplicadas. `017` (unicidade por loja + remove o valor padrão de `store_id`) **ainda não**.

## Ordem de publicação
1. Colocar as variáveis novas na Netlify e configurar o aplicativo no Mercado Pago (acima).
2. `npm install && npm run typecheck && npm run build` (este código foi escrito sem poder compilar — corrija qualquer erro de tipo que aparecer antes de publicar).
3. Subir no GitHub (a Netlify só publica se o build passar).
4. Conferir que a loja Vecorion continua vendendo normalmente.
5. Só então aplicar `supabase/migrations/017_multiloja_unicidade_por_loja.sql`.

## Limites conhecidos
- Login é por endereço: quem cria uma loja precisa entrar de novo em `loja.dominio` (a sessão não atravessa subdomínios).
- Ainda não existe reembolso pelo painel (no modelo de split o reembolso total pode falhar se a conta do lojista estiver sem saldo).
- Os ícones prontos são emojis em SVG (funcionam sem hospedar nada); dá para trocar por arte própria no Cloudinary depois.
- A oferta exclusiva (`/oferta`) continua só na loja da plataforma.
