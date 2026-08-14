"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { quoteRequestSchema } from "@/lib/validation/schemas";
import { ActionResult, actionSuccess, actionError } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { sendTransactionalEmail } from "@/lib/integrations/email";

export async function createQuoteRequestAction(formData: FormData): Promise<ActionResult> {
  const parsed = quoteRequestSchema.safeParse({
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone") || undefined,
    serviceProductId: formData.get("serviceProductId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return actionError("Verifique os campos do formulário de orçamento.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: quoteRequest, error } = await supabase
    .from("quote_requests")
    .insert({
      profile_id: user?.id ?? null, // visitante sem conta é permitido (Etapa 3)
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
      contact_phone: parsed.data.contactPhone ?? null,
      service_product_id: parsed.data.serviceProductId,
      message: parsed.data.message,
    })
    .select("*, products(name)")
    .single();

  if (error || !quoteRequest) {
    logger.error("Erro ao registrar solicitação de orçamento", { error: error?.message });
    return actionError("Não foi possível enviar sua solicitação agora. Tente novamente em instantes.");
  }

  // E-mail de confirmação ao cliente (Etapa 4, Seção 5). A notificação
  // interna para a equipe Vecorion (ex: aviso no e-mail administrativo)
  // pode reusar esta mesma função com outro destinatário quando o
  // endereço interno for definido — mantido como próximo incremento.
  try {
    await sendTransactionalEmail({
      event: "orcamento_recebido",
      to: { email: parsed.data.contactEmail, name: parsed.data.contactName },
      data: {
        customerName: parsed.data.contactName,
        serviceName: quoteRequest.products?.name ?? "serviço solicitado",
      },
    });
  } catch {
    logger.warn("E-mail de confirmação de orçamento não pôde ser enviado", { quoteRequestId: quoteRequest.id });
  }

  return actionSuccess(undefined);
}
