# Arquitetura — Loja Vecorion

Visão técnica consolidada. Para o raciocínio completo por trás de cada decisão, as etapas originais de planejamento continuam sendo a fonte mais detalhada — este documento é o resumo executivo para orientação rápida.

## Estrutura de pastas

```
src/
├── app/
│   ├── (loja)/          → rotas públicas (home, catálogo, produto, carrinho, checkout, institucional)
│   ├── (conta)/          → login, cadastro, área do cliente (protegido por middleware)
│   ├── (admin)/            → painel administrativo (protegido por middleware + verificação de papel)
│   ├── api/                  → webhook do Mercado Pago, rota de cálculo de frete
│   ├── sitemap.ts, robots.ts    → SEO técnico, gerados dinamicamente a partir do banco
│   └── layout.tsx                 → layout raiz (fontes, metadata, JSON-LD)
│
├── components/
│   ├── ui/               → primitivos (Button, Badge, PriceTag, Accordion...)
│   ├── layout/            → Header, Footer, menu mobile, carrinho
│   ├── loja/                → card de produto, filtro de catálogo, ações de compra
│   ├── carrinho/, checkout/    → fluxo de compra em etapas
│   ├── conta/                    → formulários da área do cliente
│   └── admin/                      → tabela de dados, formulário de produto, seletores de status
│
├── domain/               → regras de negócio puras (sem depender de banco/framework)
├── actions/               → Server Actions (mutações — checkout, favoritos, admin)
├── lib/
│   ├── data/                → consultas de leitura ao Supabase (catálogo)
│   ├── supabase/              → 3 clientes: browser, server (sessão), service (bypassa RLS)
│   ├── integrations/            → Mercado Pago, Correios, Brevo, entrega de digital — cada um isolado
│   └── validation/                 → schemas Zod (mesma validação no cliente e no servidor)
├── types/                  → tipos de domínio + tipos espelhando o schema do banco
└── proxy.ts                 → middleware: protege /conta e /admin, renova sessão
```

## Fluxo de uma compra, de ponta a ponta

1. Cliente navega sem precisar de conta → monta carrinho (estado local no navegador)
2. Ao finalizar, login/cadastro é exigido (`IdentificationStep`)
3. Se houver item físico: endereço (grava no banco) → frete (consulta real à API dos Correios)
4. Pagamento: `createOrderAction` recalcula preço/estoque direto do banco (nunca confia no valor do navegador), cria o pedido, cria a preferência no Mercado Pago, redireciona o cliente para lá
5. Mercado Pago notifica o webhook (`/api/webhooks/mercadopago`) de forma assíncrona
6. Webhook valida assinatura → checa idempotência → confirma status direto na API do Mercado Pago → aplica automações: decrementa estoque, gera link de download, marca curso como pendente de liberação, envia e-mail

## Banco de dados

8 migrations em `supabase/migrations/`, aplicadas em ordem. Toda tabela com dado de cliente tem Row Level Security — a regra "cliente só vê o que é dele, admin vê tudo" vive no banco, não só no código da aplicação. Tabelas sensíveis (`payments`, `order_items`, `webhook_events`) só aceitam escrita via cliente de serviço (backend), nunca diretamente do navegador.

## Autenticação e autorização

Supabase Auth, sessão via cookie seguro. Duas camadas de proteção: middleware (bloqueia navegação para quem não devia estar ali) e RLS (bloqueia a operação no banco mesmo que alguém contornasse o middleware).

## Segurança — decisões que valem lembrar

- Dado de pagamento (cartão) nunca passa pela nossa aplicação — fica inteiramente com o Mercado Pago
- Webhook exige assinatura válida antes de processar qualquer coisa
- Todo evento de webhook é registrado (`webhook_events`) para nunca aplicar o mesmo efeito duas vezes
- E-mails transacionais escapam HTML antes de interpolar dado de usuário (achado de segurança corrigido na Etapa 11)

## Onde cada integração externa mora

| Serviço | Arquivo | O que faz |
|---|---|---|
| Mercado Pago | `lib/integrations/mercadopago/` | Cria preferência de pagamento, valida webhook, consulta status |
| Correios | `lib/integrations/correios/` | Autentica e calcula frete real (PAC/SEDEX) |
| Brevo | `lib/integrations/email/` | Envia os 4 e-mails transacionais definidos no projeto |
| Storage (digital) | `lib/integrations/storage/digital-delivery.ts` | Gera link assinado e temporário de download |
