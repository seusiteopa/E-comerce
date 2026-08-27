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

  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", file);

  let response: Response;
  try {
    response = await fetch(signedUrl, { method: "PUT", body: formData });
  } catch (err) {
    throw new Error(
      `Falha de conexão ao enviar o arquivo digital (${(err as Error).name}: ${(err as Error).message}). Verifique a internet e tente de novo.`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Falha ao enviar o arquivo digital (${response.status}): ${body || response.statusText}`);
  }

  return path;
}
