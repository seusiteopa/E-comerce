# Loja Vecorion — E-commerce

E-commerce da Vecorion: produtos físicos, produtos digitais, cursos e serviços em uma única plataforma.

Construído em Next.js (App Router) + TypeScript + Tailwind CSS, com Supabase (banco de dados, autenticação e storage), Mercado Pago (pagamentos), API dos Correios (frete) e Brevo (e-mail transacional).

## Documentação

| Documento | Para quem | Conteúdo |
|---|---|---|
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Quem for publicar/manter o ambiente técnico | Passo a passo completo de deploy: Supabase, credenciais das integrações, Netlify, domínio, SSL |
| [`OPERATIONS.md`](./OPERATIONS.md) | Equipe Vecorion (uso do dia a dia) | Como cadastrar produto, gerenciar pedido, liberar curso, responder orçamento — sem jargão técnico |
| [`MAINTENANCE.md`](./MAINTENANCE.md) | Quem for evoluir o código depois | Dívida técnica conhecida, decisões em aberto, roteiro de evolução |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Desenvolvedor(a) chegando no projeto | Visão técnica consolidada: estrutura, integrações, banco de dados |
| `.env.example` | Quem for configurar variável de ambiente | Lista de toda credencial necessária, sem valor real |

## Começando (ambiente local)

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais reais (ver DEPLOYMENT.md)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento local |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção localmente |
| `npm run lint` | Verifica qualidade/padrão de código |
| `npm run typecheck` | Verifica tipos TypeScript sem gerar build |

## Stack técnica

Next.js · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · Mercado Pago · API dos Correios · Brevo · Netlify

## Status do projeto

Código, banco de dados (migrations) e integrações estão implementados e passam em build/lint/typecheck. **A publicação em produção depende de passos que só quem tem acesso às contas reais (Supabase, Mercado Pago, Correios, Brevo, Netlify, domínio) pode executar** — o passo a passo exato está em `DEPLOYMENT.md`.
