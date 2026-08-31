# Como duplicar esta loja para um cliente novo

Este projeto é um **modelo (template)**. Cada cliente novo (só produtos
físicos) ganha uma cópia própria, com infraestrutura totalmente separada —
sem misturar produtos, pedidos, clientes nem dinheiro entre lojas
diferentes.

Tempo estimado: 30-45 minutos por loja nova, sem escrever nenhuma linha de
código.

---

## 1. Duplicar o repositório no GitHub

1. Acesse `github.com/seusiteopa/E-comerce`
2. Clique no botão verde **"Use this template"** → **"Create a new repository"**
3. Dê um nome pro repositório do cliente novo (ex: `E-comerce-nome-do-cliente`)
4. Deixe como **privado**

## 2. Criar um projeto novo no Supabase

1. supabase.com → **New project**
2. Nome sugerido: `nomecliente-loja`
3. Depois de criado, vá em **SQL Editor** e rode, em ordem, todos os
   arquivos de `supabase/migrations/` (do 001 até o mais recente) — copia e
   cola o conteúdo de cada um e executa, um de cada vez, na ordem numérica
4. Em **Storage**, crie o bucket privado `produtos-digitais` (mesmo nome,
   público = desmarcado)
5. Anote (Project Settings → API Keys):
   - Project URL
   - `anon` / `publishable` key
   - `service_role` / `secret` key (aba "Publishable and secret API keys")

## 3. Criar a conta de admin desse cliente

No SQL Editor do projeto novo:

```sql
-- Depois que o cliente criar a conta dele pelo /cadastro do site novo,
-- rode isso pra promover ele a administrador (troque o e-mail):
update profiles set role = 'administrador'
where id = (select id from auth.users where email = 'email-do-cliente@exemplo.com');
```

## 4. Criar as credenciais do cliente (Mercado Pago, Cloudinary)

**Importante:** cada cliente precisa das **próprias** contas — o dinheiro
das vendas dele cai direto na conta bancária dele, não na sua.

- **Mercado Pago**: o cliente cria a própria conta em mercadopago.com.br,
  vira desenvolvedor, pega Access Token + configura o Webhook Secret
  (mesmo processo documentado no histórico deste projeto)
- **Cloudinary**: pode ser uma conta nova do cliente, ou uma pasta
  separada numa conta sua — se for conta sua, o Cloud Name/API Key/Secret
  são os mesmos, só muda o "folder" usado (já é dinâmico no código, não
  precisa mexer)

## 5. Criar o site no Netlify

1. Netlify → **Add new site** → **Import an existing project** → GitHub →
   escolhe o repositório **duplicado** (não o original da Vecorion)
2. Configure as variáveis de ambiente (Site configuration → Environment
   variables), uma por uma:

```
NEXT_PUBLIC_SUPABASE_URL=<URL do projeto Supabase novo>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key do projeto novo>
SUPABASE_SERVICE_ROLE_KEY=<service_role/secret key do projeto novo>
NEXT_PUBLIC_SITE_URL=<URL que o site vai ter, ex: https://nomecliente.netlify.app>
SECRETS_SCAN_OMIT_KEYS=MERCADOPAGO_ACCESS_TOKEN,MERCADOPAGO_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME=<do cliente ou seu>
CLOUDINARY_API_KEY=<do cliente ou seu>
CLOUDINARY_API_SECRET=<do cliente ou seu>
MERCADOPAGO_ACCESS_TOKEN=<do cliente>
MERCADOPAGO_WEBHOOK_SECRET=<do cliente>
```

3. Dispare o primeiro deploy (Deploys → Trigger deploy)

## 6. Configurar o webhook do Mercado Pago

No painel do Mercado Pago do cliente → Webhooks → adiciona a URL:

```
https://<dominio-do-site-novo>/api/webhooks/mercadopago
```

## 7. O cliente personaliza a loja dele (sem precisar de você)

O cliente entra em `/cadastro`, cria a conta, você promove ele a admin
(passo 3), e ele mesmo, pelo painel `/admin → Configurações`, já
consegue trocar:

- Nome da loja e logo
- Cores (link/contorno e botão de compra)
- Frases da faixa institucional
- Banners (principal e secundário, com foto/vídeo)
- Cupom de boas-vindas

## Pronto

A partir daqui, a loja do cliente é 100% independente — banco, domínio,
pagamentos e mídia próprios. Atualizações de funcionalidade que você
fizer no repositório **original** da Vecorion não chegam automaticamente
nas cópias — cada uma evolui separada, a menos que você decida sincronizar
manualmente no futuro (fora do escopo deste guia).
