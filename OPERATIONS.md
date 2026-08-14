# Guia de Operação — Loja Vecorion

Guia para o dia a dia de quem vai administrar a loja. Não exige conhecimento técnico.

## Como entrar no painel administrativo

1. Acesse `/login` no site da loja e entre com seu e-mail e senha.
2. Depois de logado, acesse `/admin` (o link não aparece no menu público — é só digitar o endereço).

**Primeira vez?** Sua conta nasce como "cliente" por padrão, mesmo sendo da equipe Vecorion — alguém com acesso ao painel do Supabase precisa te promover a administrador uma vez (ver seção "Promover um administrador" no fim deste guia).

## Cadastrar um novo produto

1. No painel, vá em **Produtos → Novo produto**.
2. Escolha o **tipo** primeiro (Físico, Digital, Curso ou Serviço) — isso muda quais campos aparecem depois.
3. Preencha nome, categoria, descrição e preço.
4. Marque **"Produto em destaque"** se quiser que apareça na vitrine da Home.
5. Deixe o status como **"Rascunho"** enquanto ainda está preparando, e mude para **"Ativo"** quando estiver pronto para vender — só produtos "Ativo" aparecem na loja.

**Sobre imagens, variações (tamanho/cor), arquivo digital e vínculo de curso:** por enquanto, esses detalhes complementares são adicionados diretamente no banco de dados (Supabase → Table Editor) depois de criar o produto pelo painel — a edição completa desses detalhes pela tela ainda não existe (ver `MAINTENANCE.md`, é um próximo passo natural de evolução).

## Gerenciar pedidos

Em **Pedidos**, você vê todos os pedidos com status de pagamento e pode mudar o status de entrega (ex: "Em separação" → "Enviado") conforme for despachando produtos físicos. Pedidos de produto digital/curso/serviço não precisam dessa etapa manual de envio.

## Liberar acesso a curso

Como a loja ainda não está conectada automaticamente à Vecorion Cursos, sempre que alguém compra um curso:

1. Vá em **Cursos Pendentes** — a lista mostra só cursos já pagos, aguardando liberação.
2. Libere o acesso manualmente na plataforma Vecorion Cursos (fora deste painel).
3. Volte aqui e clique em **"Marcar como liberado"** — isso tira o item da lista de pendências.

## Responder solicitação de orçamento

Em **Orçamentos**, você vê os pedidos de orçamento de serviço (nome, e-mail, mensagem do cliente). Use o menu de status para marcar o andamento:
- **Novo** → acabou de chegar
- **Em contato** → você já respondeu, aguardando o cliente
- **Respondido** → proposta enviada
- **Encerrado** → conversa finalizada (fechou negócio ou não)

O contato com o cliente (WhatsApp, e-mail, chamada) acontece fora do painel — ele só organiza o funil.

## Ver clientes

Em **Clientes**, lista de quem já se cadastrou na loja.

## Promover um administrador

Passo técnico único, feito uma vez por pessoa nova na equipe:

1. Peça para a pessoa criar uma conta normal na loja (`/cadastro`).
2. No painel do Supabase → **Table Editor → profiles**, encontre a linha com o e-mail dela.
3. Mude a coluna `role` de `cliente` para `administrador`.

## Dúvidas frequentes

**"Cadastrei um produto e ele não aparece na loja."**
Confira se o status está como "Ativo", não "Rascunho".

**"Um cliente diz que pagou mas o pedido continua como 'Aguardando pagamento'."**
Pode levar alguns instantes (principalmente Pix e boleto) até o Mercado Pago confirmar. Se persistir por mais de algumas horas, verifique diretamente no painel do Mercado Pago se o pagamento foi mesmo aprovado.
