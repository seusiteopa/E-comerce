type LogLevel = "info" | "warn" | "error";

interface LogContext {
  orderId?: string;
  userId?: string;
  integration?: "mercadopago" | "correios" | "brevo" | "supabase";
  [key: string]: unknown;
}

/**
 * Logger estruturado mínimo, suficiente para o volume do MVP (Etapa 7,
 * Seção 10 — sem ferramenta paga de observabilidade nesta fase).
 *
 * Regra de segurança: NUNCA logar dado de pagamento, senha, ou payload
 * bruto com dado pessoal completo — apenas identificadores e status.
 */
function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
