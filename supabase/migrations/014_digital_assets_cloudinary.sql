-- ============================================================================
-- Migration 014: digital_assets passa a suportar Cloudinary como provedor
-- de armazenamento do arquivo, além do Supabase Storage.
--
-- Motivo: o upload direto do navegador pro Supabase Storage (signed
-- upload URL) falhava de forma consistente com "Failed to fetch" no PUT
-- de envio, em algumas redes/navegadores (provável bloqueio de CORS no
-- preflight), mesmo com a geração da URL assinada funcionando
-- normalmente no servidor. O Cloudinary já era usado (com sucesso
-- comprovado) para foto/vídeo de produto, então o arquivo digital passou
-- a usar o mesmo caminho — como recurso "privado" (type: private), que
-- não fica acessível por URL pública, só via link assinado gerado na
-- entrega (mesma proteção de antes).
--
-- provider: 'supabase' (produtos já cadastrados antes desta mudança,
-- continuam funcionando pelo caminho antigo) ou 'cloudinary' (novos).
-- format: extensão do arquivo, necessária para gerar o link de download
-- assinado do Cloudinary.
-- ============================================================================

alter table digital_assets
  add column if not exists provider text not null default 'supabase' check (provider in ('supabase', 'cloudinary')),
  add column if not exists format text;
