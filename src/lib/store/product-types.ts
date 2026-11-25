export type ProductKind = "fisico" | "digital";

/**
 * Tipos de produto que uma loja pode ter, pelo tipo da loja:
 * física e lanchonete vendem produto físico; virtual e cursos vendem produto digital; mista aceita os dois.
 */
export function allowedProductTypes(storeType: string): ProductKind[] {
  if (storeType === "digital" || storeType === "curso") return ["digital"];
  if (storeType === "loja" || storeType === "restaurante") return ["fisico"];
  return ["fisico", "digital"];
}

/** Tipo de uma categoria nova: o pedido, se a loja aceitar; senão o único tipo permitido. */
export function resolveCategoryType(storeType: string, requested: string | null | undefined): ProductKind {
  const allowed = allowedProductTypes(storeType);
  return allowed.find((t) => t === requested) ?? allowed[0];
}
