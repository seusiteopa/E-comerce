/** Regra de liberação do painel de uma loja de cliente. Lojas da plataforma não passam por aqui. */
export const AUTHORIZED_SUBSCRIPTION_STATUSES = ["em_teste", "ativa"] as const;

export function isStoreAuthorized(billing: { subscription_status?: string | null; painel_liberado?: boolean | null } | null): boolean {
  if (billing?.painel_liberado) return true;
  return (AUTHORIZED_SUBSCRIPTION_STATUSES as readonly string[]).includes(billing?.subscription_status ?? "");
}
