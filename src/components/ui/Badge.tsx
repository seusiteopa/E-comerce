import { ProductType, OrderStatus, PaymentStatus } from "@/types";

const typeLabels: Record<ProductType, string> = {
  fisico: "Físico",
  digital: "Digital",
  curso: "Curso",
  servico: "Serviço",
};

export function ProductTypeBadge({ type }: { type: ProductType }) {
  return (
    <span className="inline-flex items-center rounded-full border border-navy/20 bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
      {typeLabels[type]}
    </span>
  );
}

const levelLabels: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

/** Selo de nível de curso — mesmo padrão já validado no projeto Vecorion Cursos. */
export function LevelBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-farol/15 px-3 py-1 text-xs font-semibold text-farol-deep">
      {levelLabels[level] ?? level}
    </span>
  );
}

/** Selo de categoria — texto simples com contorno, usado na trilha da página de produto. */
export function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft">
      {label}
    </span>
  );
}

const orderStatusConfig: Record<OrderStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  aguardando_pagamento: { label: "Aguardando pagamento", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  em_separacao: { label: "Em separação", tone: "neutral" },
  enviado: { label: "Enviado", tone: "neutral" },
  entregue: { label: "Entregue", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  pendente: { label: "Pendente", tone: "warning" },
  aprovado: { label: "Aprovado", tone: "success" },
  recusado: { label: "Recusado", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "danger" },
  reembolsado: { label: "Reembolsado", tone: "neutral" },
};

const toneStyles = {
  success: "bg-status-success-bg text-status-success",
  warning: "bg-status-warning-bg text-status-warning",
  danger: "bg-status-danger-bg text-status-danger",
  neutral: "bg-status-neutral-bg text-status-neutral",
};

/** Selo de status — componente único reutilizado no admin e na área do cliente (Etapa 5/7). */
export function StatusPill({ status, kind }: { status: OrderStatus | PaymentStatus; kind: "order" | "payment" }) {
  const config = kind === "order" ? orderStatusConfig[status as OrderStatus] : paymentStatusConfig[status as PaymentStatus];
  return (
    <span className={`font-mono-label inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneStyles[config.tone]}`}>
      {config.label}
    </span>
  );
}
