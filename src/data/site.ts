/**
 * Configuração central do site — front-end only nesta etapa.
 * Nenhum destes valores vem de banco de dados ainda (Etapa 9 conecta ao Supabase).
 */

export const siteConfig = {
  name: "Vecorion",
  storeName: "Loja Vecorion",
  tagline: "Tecnologia, produtos e soluções em um só lugar.",
  description:
    "E-commerce da Vecorion: produtos físicos e produtos digitais com tecnologia, inteligência artificial e atendimento próximo às pessoas.",
  url: "https://loja.vecorion.com.br",
};

export const contact = {
  whatsappNumber: "5519991892801",
  whatsappDefaultMessage: "Olá! Vim da loja da Vecorion e gostaria de saber mais.",
  email: "contato@vecorion.com.br",
  phone: "(19) 99189-2801",
  instagram: "https://instagram.com/vecorion",
};

export const mainNav = [
  { label: "Início", href: "/" },
  { label: "Produtos Físicos", href: "/categorias/produtos-fisicos" },
  { label: "Produtos Digitais", href: "/categorias/produtos-digitais" },
];

export function whatsappHref(message?: string) {
  const text = encodeURIComponent(message ?? contact.whatsappDefaultMessage);
  return `https://wa.me/${contact.whatsappNumber}?text=${text}`;
}
