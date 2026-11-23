import { describe, expect, it } from "vitest";
import { toEmbedUrl } from "./video";

describe("toEmbedUrl", () => {
  it("aceita link curto e longo do YouTube", () => {
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
  it("aceita Shorts e embed do YouTube", () => {
    expect(toEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
  it("aceita Vimeo", () => {
    expect(toEmbedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789");
  });
  it("aceita o endereço já convertido ao editar", () => {
    expect(toEmbedUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(toEmbedUrl("https://player.vimeo.com/video/123456789")).toBe("https://player.vimeo.com/video/123456789");
  });
  it("recusa outros sites e links sem vídeo", () => {
    expect(toEmbedUrl("https://exemplo.com/video")).toBeNull();
    expect(toEmbedUrl("https://www.youtube.com/")).toBeNull();
    expect(toEmbedUrl("http://youtu.be/dQw4w9WgXcQ")).toBeNull();
    expect(toEmbedUrl("não é link")).toBeNull();
  });
});
