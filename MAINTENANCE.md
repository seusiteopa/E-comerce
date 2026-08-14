# Manutenção e Evolução — Loja Vecorion

Este documento existe para que quem continuar este projeto (você mesmo no futuro, ou outra pessoa) não precise redescobrir o que já sabemos. Nada aqui é segredo — é a mesma dívida técnica já registrada ao longo das Etapas 9 a 13, consolidada em um só lugar.

## Pendências conhecidas, por prioridade

### Alta prioridade (resolver antes de crescer o volume de vendas)

- **Peso e dimensões de produto físico ainda usam valor fixo** (500g, 20×10×30cm) no cálculo de frete, em vez do dado real de cada variação (`product_variations.weight_grams` já existe na tabela, só não é lido ainda). Está em `src/actions/checkout.ts` e `src/components/checkout/ShippingStep.tsx`, marcado com `TODO` no código. Sem essa correção, o frete cobrado pode não bater com o custo real de envio de produtos maiores/mais pesados.
- **CEP de origem dos Correios é placeholder** (`src/lib/integrations/correios/index.ts`) — precisa ser trocado pelo CEP real de despacho antes do primeiro envio de produto físico.
- **E-mail remetente do Brevo não confirmado** (`src/lib/integrations/email/index.ts`) — precisa apontar para um e-mail verificado no painel do Brevo, ou todo envio falha.

### Média prioridade

- **Regra de frete grátis existe mas não está conectada** (`src/domain/frete/regras.ts`, função `qualifiesForFreeShipping`). Foi criada porque o briefing menciona frete grátis, mas nunca ficou definido *a partir de qual valor* — hoje é um placeholder de R$250 que ninguém confirmou. Decida o valor e conecte à Server Action de checkout, ou remova a função se a Vecorion decidir não oferecer frete grátis por enquanto.
- **Limite de download de produto digital existe na tabela mas não é aplicado** (`digital_assets.download_limit`). Hoje qualquer cliente que comprou pode gerar o link de download quantas vezes quiser dentro do prazo de 7 dias do link. Se quiser limitar por quantidade de downloads (não só por tempo), é preciso somar um contador em `lib/integrations/storage/digital-delivery.ts`.
- **CRUD de categoria, cupom e banner pelo painel** ainda é só leitura — criação/edição desses três hoje passa pelo SQL Editor do Supabase (documentado em `OPERATIONS.md`). Produto já tem criação pelo painel; os outros três seguem o mesmo padrão de componente (`AdminForm`) quando for a vez de implementar.
- **Edição de produto** (imagens, variações, arquivo digital, vínculo de curso) também ainda passa pelo banco diretamente — só a criação inicial do produto tem tela própria.

### Baixa prioridade / evolução futura

- **Integração real com a Vecorion Cursos.** Hoje a liberação de acesso a curso é manual (fila "Cursos Pendentes"). Quando a Vecorion Cursos ganhar seu próprio backend/autenticação, dá para trocar esse processo manual por uma chamada de API — o campo `course_links.external_course_reference` já existe pensando nisso.
- **WhatsApp Business API.** Hoje só existem links `wa.me` estáticos. Automação real de notificação por WhatsApp (ex: "seu pedido foi enviado") é uma evolução possível, mas exige aprovação/custo do WhatsApp Business API — não é gratuita como o restante do stack atual.
- **Marketplace multi-vendedor, assinatura, programa de afiliados.** O briefing original já registrava esses itens como evolução futura, não obrigação do lançamento — a estrutura de dados atual (um "tipo" por produto, sem conceito de vendedor) comporta essa extensão sem precisar recriar o schema do zero, mas exigirá novas tabelas e telas quando chegar a hora.

## Como atualizar dependências com segurança

```bash
npm outdated        # vê o que está desatualizado
npm audit            # verifica vulnerabilidade conhecida
npm update            # atualiza dentro das faixas de versão já aceitas
npm run build && npm run lint && npm run typecheck   # confirma que nada quebrou
```

Recomendação: rodar isso a cada 1-2 meses, não deixar acumular muitas versões de atraso de uma vez.

## Como adicionar uma nova migration de banco

1. Crie um novo arquivo em `supabase/migrations/`, com o próximo número da sequência (ex: `009_algo.sql`) — nunca edite uma migration já aplicada em produção.
2. Teste a migration em um projeto Supabase separado (ambiente de teste) antes de aplicar em produção, se possível.
3. Aplique em produção pelo SQL Editor do Supabase (mesmo processo do `DEPLOYMENT.md`).

## Filosofia para quem for mexer no código

Este projeto foi construído em camadas (`domain/` para regra de negócio pura, `actions/` para orquestração, `lib/integrations/` para cada serviço externo isolado, `lib/data/` para leitura). Ao adicionar uma funcionalidade nova, o primeiro instinto deveria ser "em qual dessas camadas isso se encaixa", não "vou colocar tudo dentro do componente React que precisa disso agora" — é o que manteve o projeto navegável mesmo depois de crescer bastante entre as Etapas 8 e 13.
