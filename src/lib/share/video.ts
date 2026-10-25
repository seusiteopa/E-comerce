export type ShareMediaItem = { url: string; media_type: string; display_order: number };

/** Primeiro vídeo da lista, na ordem cadastrada. Null se não houver vídeo. */
export function pickShareVideo(items: ShareMediaItem[]): string | null {
  const videos = [...items]
    .filter((i) => i.media_type === "video" && i.url)
    .sort((a, b) => a.display_order - b.display_order);
  return videos[0]?.url ?? null;
}
