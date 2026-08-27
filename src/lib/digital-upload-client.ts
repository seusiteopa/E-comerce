import { getDigitalUploadTargetAction } from "@/actions/digital-upload";

/**
 * Sobe o arquivo digital (ebook, PDF, ZIP...) DIRETO do navegador pro
 * bucket privado do Supabase Storage. Retorna o caminho salvo (storage
 * path), que é o que fica registrado em `digital_assets`.
 *
 * Usa fetch() puro direto na URL assinada, com FormData simples (sem
 * cabeçalhos manuais — o navegador define o Content-Type/boundary
 * sozinho). Evita passar pelo método uploadToSignedUrl do supabase-js,
 * que adiciona o cabeçalho x-upsert; em algumas redes isso faz o
 * preflight de CORS falhar de forma silenciosa ("Failed to fetch"),
 * sem nem chegar a aparecer no log do servidor.
 */
export async function uploadDigitalFileToStorage(file: File): Promise<string> {
  const extension = file.name.split(".").pop() ?? "bin";
  const { path, signedUrl } = await getDigitalUploadTargetAction(extension);

  // Diagnóstico temporário: confirma que a URL recebida é válida antes de
  // tentar usá-la, e testa separado se um fetch simples (GET) pro mesmo
  // servidor já funciona a partir do navegador — isola se o problema é
  // geral (qualquer fetch pro Supabase trava) ou específico do PUT.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(signedUrl);
  } catch {
    throw new Error(`URL de upload veio inválida do servidor: "${signedUrl}"`);
  }

  try {
    const probe = await fetch(`${parsedUrl.origin}/storage/v1/`, { method: "GET", mode: "cors" });
    await probe.text().catch(() => undefined);
  } catch (err) {
    throw new Error(
      `Diagnóstico: até um GET simples pro Supabase falhou do navegador (${(err as Error).name}: ${(err as Error).message}). Origem testada: ${parsedUrl.origin}`
    );
  }

  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", file);

  let response: Response;
  try {
    response = await fetch(signedUrl, { method: "PUT", mode: "cors", body: formData });
  } catch (err) {
    throw new Error(
      `Diagnóstico: GET simples funcionou, mas o PUT falhou (${(err as Error).name}: ${(err as Error).message}). Caminho: ${parsedUrl.pathname}`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar o arquivo digital (${response.status}): ${body || response.statusText}`);
  }

  return path;
}
