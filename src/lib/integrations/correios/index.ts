import "server-only";

/**
 * Módulo de cálculo de frete — versão TEMPORÁRIA com valores fixos.
 *
 * Motivo: a integração real com a API dos Correios exige contrato comercial
 * ativo (CNPJ + certificado digital válido), que hoje está vencido. Enquanto
 * isso é resolvido — ou enquanto a integração com um agregador tipo Melhor
 * Envio não é feita — usamos valores fixos por modalidade, pra loja continuar
 * vendendo normalmente.
 *
 * IMPORTANTE: a assinatura de `calculateShipping` é a mesma do módulo real.
 * Quando a integração real (Correios ou Melhor Envio) estiver pronta, basta
 * substituir o conteúdo deste arquivo — nenhum outro lugar do sistema
 * (checkout, rota /api/frete) precisa mudar.
 */

const FIXED_RATES = {
  pac: { price: 20, estimatedDays: 7 },
  sedex: { price: 35, estimatedDays: 3 },
} as const;

export interface CalculateShippingInput {
  destinationZipCode: string;
  totalWeightGrams: number;
  dimensions: { widthCm: number; heightCm: number; lengthCm: number };
}

export interface ShippingOption {
  method: "pac" | "sedex";
  price: number;
  estimatedDays: number;
}

export async function calculateShipping(
  _input: CalculateShippingInput
): Promise<ShippingOption[]> {
  return [
    { method: "pac", price: FIXED_RATES.pac.price, estimatedDays: FIXED_RATES.pac.estimatedDays },
    { method: "sedex", price: FIXED_RATES.sedex.price, estimatedDays: FIXED_RATES.sedex.estimatedDays },
  ];
}
