import { MP_PUBLIC_KEY } from "@/lib/integrations/mercadopago/public-key";

type MPInstance = {
  createCardToken: (input: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<{ id: string }>;
  getPaymentMethods: (input: { bin: string }) => Promise<{ results?: { id: string; payment_type_id: string }[] }>;
};
type MPConstructor = new (key: string, options?: { locale?: string }) => MPInstance;

let sdkPromise: Promise<MPConstructor> | null = null;

/** Carrega a biblioteca do Mercado Pago no navegador (uma vez). */
export function loadMercadoPago(): Promise<MPConstructor> {
  const w = window as unknown as { MercadoPago?: MPConstructor };
  if (w.MercadoPago) return Promise.resolve(w.MercadoPago);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => (w.MercadoPago ? resolve(w.MercadoPago) : reject(new Error("sdk")));
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("sdk"));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export interface CardFormValues {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  cpf: string;
}

/** Gera o token do cartão no navegador. Os números do cartão nunca passam pelo nosso servidor. */
export async function tokenizeCard(
  card: CardFormValues,
  type: "credit_card" | "debit_card" = "credit_card"
): Promise<{ token: string; paymentMethodId: string }> {
  const MPClass = await loadMercadoPago();
  const mp = new MPClass(MP_PUBLIC_KEY, { locale: "pt-BR" });
  const number = card.number.replace(/\D/g, "");
  const [mm, yy] = card.expiry.split("/").map((v) => v.trim());
  const year = yy && yy.length === 2 ? `20${yy}` : (yy ?? "");

  let token: { id: string };
  try {
    token = await mp.createCardToken({
      cardNumber: number,
      cardholderName: card.name,
      cardExpirationMonth: mm ?? "",
      cardExpirationYear: year,
      securityCode: card.cvv,
      identificationType: "CPF",
      identificationNumber: card.cpf.replace(/\D/g, ""),
    });
  } catch (error) {
    throw new Error(mpTokenErrorMessage(error));
  }

  const methods = await mp.getPaymentMethods({ bin: number.slice(0, 6) });
  const method = methods.results?.find((m) => m.payment_type_id === type);
  if (!method) {
    throw new Error(
      type === "debit_card"
        ? "Este cartão não é de débito. Escolha crédito ou pague com Pix."
        : "Este cartão não é de crédito. Escolha débito ou pague com Pix."
    );
  }
  return { token: token.id, paymentMethodId: method.id };
}

/** Validade digitada só com números: a barra entra sozinha (ex.: "1228" -> "12/28"). */
export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Traduz o erro do MercadoPago.js (createCardToken) para uma mensagem que a pessoa consiga corrigir. */
function mpTokenErrorMessage(error: unknown): string {
  const causes = (error as { cause?: { code?: string | number }[] })?.cause ?? [];
  const code = String(causes[0]?.code ?? "");
  switch (code) {
    case "E301":
      return "Número do cartão inválido. Confira os dígitos.";
    case "E302":
      return "Código de segurança inválido.";
    case "E203":
    case "E205":
    case "E208":
    case "E209":
      return "Data de validade inválida. Confira o mês e o ano.";
    case "E204":
      return "Nome do titular inválido. Use o nome impresso no cartão.";
    case "224":
    case "E224":
      return "CPF do titular inválido.";
    default:
      return code
        ? `O cartão não foi validado (código ${code}). Confira os dados ou tente outro cartão.`
        : "Não foi possível validar o cartão. Confira os dados e tente de novo.";
  }
}
