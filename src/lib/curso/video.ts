/** Links de aula aceitos: YouTube (não listado ou público) e Vimeo. Devolve o endereço para exibir dentro da página, ou null. */
export function toEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  // Endereço já convertido (ao reabrir a aula para editar).
  if (host === "youtube-nocookie.com") {
    const m = /^\/embed\/([\w-]{6,20})$/.exec(url.pathname);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (host === "player.vimeo.com") {
    const m = /^\/video\/(\d{5,12})$/.exec(url.pathname);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const m = /^\/(embed|shorts)\/([\w-]{6,20})$/.exec(url.pathname);
    return m ? `https://www.youtube-nocookie.com/embed/${m[2]}` : null;
  }
  if (host === "vimeo.com") {
    const m = /^\/(\d{5,12})(?:\/[\w-]+)?$/.exec(url.pathname);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  return null;
}
