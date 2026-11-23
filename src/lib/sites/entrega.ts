/** Regras das entregas de site: endereço e arquivo HTML. Sem dependência de banco. */
export const SITE_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SITE_MAX_BYTES = 500_000;

/** Devolve o erro de validação, ou null se o endereço e o arquivo estiverem certos. */
export function validateSiteDelivery(slug: string, html: string): string | null {
  if (slug.length < 3 || slug.length > 60) return "O endereço precisa ter entre 3 e 60 caracteres.";
  if (!SITE_SLUG_RE.test(slug)) return "Use só letras minúsculas, números e hífen no endereço.";
  if (!html.trim()) return "O arquivo está vazio.";
  if (new TextEncoder().encode(html).length > SITE_MAX_BYTES) return "O arquivo passou de 500 KB. Reduza as imagens ou use links externos.";
  if (!/<html[\s>]|<!doctype html/i.test(html)) return "O arquivo precisa ser um HTML completo (com <html>).";
  return null;
}
