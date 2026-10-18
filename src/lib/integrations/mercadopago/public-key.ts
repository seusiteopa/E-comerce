/**
 * Chave PÚBLICA do Mercado Pago (conta Vecorion, produção).
 * É feita para ficar no navegador: o cartão é tokenizado com ela pelo MercadoPago.js.
 * Nunca colocar aqui o Access Token (esse é secreto e fica só no servidor).
 */
export const MP_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "APP_USR-28d8bbc8-ab80-44c9-acf0-a038223a8bc2";
