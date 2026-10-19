import type { NextConfig } from "next";

/**
 * Configuração de produção — Etapa 12 (otimização final).
 *
 * Cada opção abaixo tem uma justificativa técnica específica; nada aqui
 * altera comportamento de negócio, só desempenho/segurança/SEO.
 */
const nextConfig: NextConfig = {
  // Limite padrão do Next para payload de Server Actions é 1MB — muito
  // pouco para envio de fotos/vídeo de produto e banner (ver
  // uploadToCloudinary). Netlify Functions tem seu próprio teto de
  // payload (~vale a pena manter vídeos enxutos, na prática); 20mb cobre
  // bem fotos e vídeos curtos de produto/banner.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  // Remove o header "X-Powered-By: Next.js" das respostas — informação
  // de stack técnico não deveria ser exposta publicamente (superfície de
  // reconhecimento reduzida para um possível atacante).
  poweredByHeader: false,

  // Compressão gzip/br das respostas do servidor Next — reduz o peso de
  // HTML/JSON transferido, especialmente relevante em conexões móveis
  // (público-alvo definido na Etapa 1 trabalha primariamente em Android).
  compress: true,

  images: {
    // Formatos modernos com melhor compressão que JPEG/PNG tradicionais;
    // o Next serve automaticamente o melhor formato suportado pelo
    // navegador do visitante, com fallback transparente.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  async headers() {
    return [
      {
        // Cabeçalhos de segurança aplicados a toda resposta (Etapa 7/9,
        // reforço de segurança sem alterar nenhuma regra de negócio).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Modo de relatório: registra no console o que seria bloqueado, sem bloquear nada.
          // Só ativar o bloqueio (Content-Security-Policy) depois de conferir que nada quebra.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co",
              "media-src 'self' blob: https://res.cloudinary.com https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://api.cloudinary.com https://sdk.mercadopago.com",
              "frame-src 'self' https://sdk.mercadopago.com https://auth.mercadopago.com.br https://www.mercadopago.com.br",
              "form-action 'self' https://auth.mercadopago.com.br https://www.mercadopago.com.br",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Assets estáticos versionados pelo Next (hash no nome do arquivo)
        // podem ser cacheados de forma agressiva e imutável — o próprio
        // nome do arquivo muda quando o conteúdo muda, então não há risco
        // de servir versão desatualizada.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Ativos de marca (logo, ícones) mudam raramente — cache longo,
        // mas revalidável (sem "immutable", já que o nome do arquivo não
        // tem hash de conteúdo).
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
