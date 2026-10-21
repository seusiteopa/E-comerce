import "server-only";
import { logger } from "@/lib/logger";

/**
 * Módulo de fronteira com o Brevo (Etapa 4/7 — provedor confirmado).
 * Usa a API HTTP transacional do Brevo diretamente (sem SDK adicional,
 * para manter a dependência mínima) — POST https://api.brevo.com/v3/smtp/email.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "Vecorion", email: "loja@vecorion.com.br" }; // TODO: confirmar e-mail remetente verificado no Brevo

export type TransactionalEmailEvent =
  | "falha_pagamento"
  | "pedido_criado"
  | "pagamento_aprovado"
  | "pedido_enviado"
  | "orcamento_recebido"
  | "mensalidade_atrasada"
  | "mensalidade_confirmada";

export interface SendTransactionalEmailInput {
  event: TransactionalEmailEvent;
  to: { email: string; name: string };
  data: Record<string, string | number>;
}

const subjectByEvent: Record<TransactionalEmailEvent, string> = {
  falha_pagamento: "Pagamento não concluído em um pedido — Vecorion",
  pedido_criado: "Recebemos seu pedido — Vecorion",
  pagamento_aprovado: "Pagamento confirmado — Vecorion",
  pedido_enviado: "Seu pedido foi enviado — Vecorion",
  orcamento_recebido: "Recebemos sua solicitação de orçamento — Vecorion",
  mensalidade_atrasada: "Não conseguimos cobrar a mensalidade da sua loja — Vecorion",
  mensalidade_confirmada: "Mensalidade da sua loja confirmada — Vecorion",
};

/**
 * Escapa caracteres HTML especiais antes de interpolar qualquer dado
 * fornecido por usuário (nome de cliente, nome de serviço etc.) no corpo
 * do e-mail. Sem isso, alguém poderia cadastrar um nome contendo HTML/JS
 * e injetar conteúdo arbitrário no e-mail enviado via Brevo — encontrado
 * e corrigido durante a QA da Etapa 11.
 */
function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Monta o corpo HTML do e-mail a partir do evento. Nesta etapa, o corpo é
 * gerado de forma simples e direta em código — se o volume de e-mails
 * justificar no futuro, isso pode migrar para templates gerenciados
 * diretamente no painel do Brevo (por ID de template), sem mudar a
 * assinatura desta função.
 */
function buildEmailHtml(event: TransactionalEmailEvent, data: Record<string, string | number>): string {
  const safe = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, escapeHtml(value)]));

  switch (event) {
    case "falha_pagamento":
      return `<p>Olá!</p><p>Um pagamento do pedido <strong>#${safe.orderId}</strong> da loja <strong>${safe.storeName}</strong> não foi concluído. Motivo: ${safe.reason}.</p><p>Se o cliente precisar de ajuda, peça para ele tentar outra forma de pagamento.</p>`;
    case "pedido_criado":
      return `<p>Olá, ${safe.customerName}!</p><p>Recebemos seu pedido <strong>#${safe.orderId}</strong>, no valor de ${safe.total}. Assim que o pagamento for confirmado, você recebe um novo aviso por aqui.</p>`;
    case "pagamento_aprovado":
      return `<p>Olá, ${safe.customerName}!</p><p>Seu pagamento do pedido <strong>#${safe.orderId}</strong> foi aprovado. ${safe.extraMessage ?? ""}</p>`;
    case "pedido_enviado":
      return `<p>Olá, ${safe.customerName}!</p><p>Seu pedido <strong>#${safe.orderId}</strong> foi enviado. ${safe.trackingInfo ?? ""}</p>`;
    case "orcamento_recebido":
      return `<p>Olá, ${safe.customerName}!</p><p>Recebemos sua solicitação de orçamento para <strong>${safe.serviceName}</strong>. Nossa equipe entrará em contato em breve.</p>`;
    case "mensalidade_atrasada":
      return `<p>Olá!</p><p>Não conseguimos cobrar a mensalidade da loja <strong>${safe.storeName}</strong> no meio de pagamento autorizado. Sua loja continua funcionando normalmente, mas pedimos que verifique o cartão ou a conta autorizada no Mercado Pago para regularizar.</p>`;
    case "mensalidade_confirmada":
      return `<p>Olá!</p><p>A mensalidade da loja <strong>${safe.storeName}</strong> foi cobrada com sucesso. Obrigado por usar a Vecorion.</p>`;
  }
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    logger.error("BREVO_API_KEY não configurado — e-mail não enviado.", { integration: "brevo", event: input.event });
    throw new Error("Serviço de e-mail não configurado.");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [input.to],
      subject: subjectByEvent[input.event],
      htmlContent: buildEmailHtml(input.event, input.data),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    logger.error("Falha ao enviar e-mail transacional", {
      integration: "brevo",
      event: input.event,
      status: response.status,
      // Nunca logar o corpo completo (pode conter dado pessoal) — só o
      // suficiente para diagnosticar o tipo de erro retornado pelo Brevo.
      errorSnippet: errorBody.slice(0, 200),
    });
    // Falha de e-mail não deve derrubar o fluxo principal (pagamento já foi
    // processado) — o chamador decide se trata como crítico ou apenas loga.
    throw new Error("Não foi possível enviar o e-mail de notificação.");
  }

  logger.info("E-mail transacional enviado", { integration: "brevo", event: input.event });
}
