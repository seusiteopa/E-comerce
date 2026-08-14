# Deploy da Loja Vecorion — Guia Completo

Este guia assume que você (ou quem for publicar) tem acesso a: e-mail, celular (para os apps das plataformas), e cartão/CPF/CNPJ para abrir as contas necessárias. Pode ser feito majoritariamente pelo navegador do celular.

**Ordem importa.** Siga na sequência abaixo — algumas etapas geram credenciais que a etapa seguinte precisa.

---

## 1. Provisionar o Supabase (banco de dados, login, arquivos)

1. Acesse [supabase.com](https://supabase.com), crie uma conta e um **novo projeto**.
2. Anote, em **Project Settings → API**:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → vai virar `SUPABASE_SERVICE_ROLE_KEY` (**nunca compartilhe esta chave, nunca a coloque no código**)

### 1.1 Rodar as migrations (estrutura do banco)

O projeto tem 8 arquivos de migration em `supabase/migrations/`, numerados e prontos para rodar em ordem. Duas formas de aplicar:

**Opção simples (painel do Supabase, pelo celular ou computador):**
No projeto Supabase, vá em **SQL Editor** → **New query**, abra cada arquivo de `supabase/migrations/` (do `001` ao `008`, na ordem numérica) e cole/rode o conteúdo, um de cada vez.

**Opção via CLI (computador, se preferir automatizar):**
```bash
npx supabase login
npx supabase link --project-ref <ref-do-seu-projeto>
npx supabase db push
```

Depois das migrations, rode também o `supabase/seed.sql` (mesma forma) — ele cadastra as categorias iniciais do briefing.

### 1.2 Criar o bucket de Storage (produtos digitais)

**Passo que não é automatizado por migration** (Storage é gerenciado separadamente do banco no Supabase) — não pule este passo, o download de produto digital depende dele:

1. No painel do Supabase, vá em **Storage** → **New bucket**.
2. Nome exato: `produtos-digitais`
3. Marque como **privado** (não público) — a entrega ao cliente acontece por link assinado temporário, gerado pelo próprio sistema, nunca por acesso direto ao arquivo.

### 1.3 Configurar e-mail de autenticação (opcional, recomendado)

Em **Authentication → Email Templates**, você pode personalizar o e-mail de confirmação de cadastro/recuperação de senha com a identidade visual da Vecorion (os ativos estão em `public/brand/`).

---

## 2. Mercado Pago (pagamentos)

1. Crie/acesse uma conta em [mercadopago.com.br](https://www.mercadopago.com.br), como conta de **vendedor**.
2. Acesse [Suas integrações](https://www.mercadopago.com.br/developers/panel) → crie uma aplicação.
3. Em **Credenciais de produção**, copie:
   - `Access Token` → vai virar `MERCADOPAGO_ACCESS_TOKEN`
4. Configure o **Webhook**: em **Webhooks**, adicione a URL `https://loja.vecorion.com.br/api/webhooks/mercadopago` (ou o domínio real que você definir no passo 6), evento `payment`.
5. No mesmo painel de webhook, copie a **Chave secreta de assinatura** → vai virar `MERCADOPAGO_WEBHOOK_SECRET`.

⚠️ Use as credenciais de **teste** primeiro (o Mercado Pago tem um par de credenciais de teste e outro de produção) para validar o fluxo completo de compra antes de trocar para produção.

---

## 3. API dos Correios (frete)

1. Acesse o [Portal do Desenvolvedor dos Correios](https://www.correios.com.br/atendimento/developers) e solicite acesso à API (exige contrato/cartão de postagem — normalmente vinculado a um CNPJ).
2. Após aprovado, você recebe usuário e senha de API:
   - Usuário → `CORREIOS_API_USER`
   - Senha → `CORREIOS_API_PASSWORD`
3. Confirme o **CEP de origem** real de onde os produtos físicos serão despachados e atualize a constante `ORIGIN_ZIP_CODE` em `src/lib/integrations/correios/index.ts` (é o único lugar do código que precisa desse ajuste manual).

Se este processo ainda não estiver concluído no momento do lançamento, o sistema já foi desenhado para isso não travar as vendas de produto digital/curso/serviço — apenas o checkout de produto físico fica indisponível até essa credencial existir (ver `MAINTENANCE.md`).

---

## 4. Brevo (e-mail transacional)

1. Crie uma conta em [brevo.com](https://www.brevo.com) (tem plano gratuito).
2. Em **Configurações → Chaves SMTP e API**, gere uma API Key → vai virar `BREVO_API_KEY`.
3. Em **Expedidores**, cadastre e verifique o e-mail remetente (ex: `loja@vecorion.com.br`) — sem essa verificação, o Brevo recusa o envio. Atualize também a constante `SENDER` em `src/lib/integrations/email/index.ts` se usar um e-mail diferente do exemplo.

---

## 5. Publicar na Netlify

1. Suba o projeto para um repositório no GitHub (se ainda não estiver lá).
2. Em [app.netlify.com](https://app.netlify.com), **Add new site → Import an existing project**, conecte o repositório.
3. A Netlify detecta o `netlify.toml` automaticamente (comando de build já configurado).
4. Em **Site settings → Environment variables**, adicione **todas** as variáveis abaixo (mesmos nomes de `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
CORREIOS_API_USER
CORREIOS_API_PASSWORD
BREVO_API_KEY
NEXT_PUBLIC_SITE_URL
```

5. Dispare o deploy (**Trigger deploy**).

---

## 6. Domínio próprio e SSL

1. Em **Site settings → Domain management → Add a domain**, digite o domínio da Vecorion (ex: `loja.vecorion.com.br`).
2. A Netlify mostra os registros DNS a configurar no seu provedor de domínio (geralmente um `CNAME`, apontando para o site da Netlify).
3. **SSL é automático**: assim que o DNS propaga (minutos a poucas horas), a Netlify emite certificado via Let's Encrypt sozinha — nenhuma ação manual adicional.
4. Depois do domínio confirmado, **atualize `NEXT_PUBLIC_SITE_URL`** nas variáveis de ambiente para o domínio real e **atualize a URL do webhook no Mercado Pago** (passo 2.4) para o mesmo domínio — os dois precisam bater exatamente.

---

## 7. Validação pós-deploy (checklist)

Depois de tudo publicado, teste nesta ordem antes de anunciar a loja:

- [ ] Home carrega e mostra produtos (cadastre ao menos 1 produto de cada tipo pelo `/admin/produtos/novo` antes de testar)
- [ ] Cadastro de conta funciona e chega e-mail de confirmação
- [ ] Login funciona
- [ ] Adicionar produto físico ao carrinho → frete calcula com CEP real
- [ ] Compra de teste com credencial de teste do Mercado Pago é aprovada e o pedido muda de status automaticamente
- [ ] E-mail de "pagamento aprovado" chega
- [ ] Produto digital: link de download aparece em "Meus Downloads" após pagamento
- [ ] Curso: item aparece em `/admin/cursos-pendentes` após pagamento
- [ ] Painel admin: login como administrador funciona (ver `OPERATIONS.md` para promover um usuário a administrador)
- [ ] Só depois de tudo acima validado, troque as credenciais do Mercado Pago de teste para produção

---

## Resumo de todas as variáveis de ambiente

Ver `.env.example` na raiz do projeto — é a lista oficial, mantida sincronizada com o código (toda variável usada no código está documentada lá, sem exceção, conforme auditoria da Etapa 13).
