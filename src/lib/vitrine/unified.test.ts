import { describe, expect, it } from "vitest";
import { escapeSearchTerm, pickCoverUrl } from "./unified";

describe("pickCoverUrl", () => {
  it("escolhe a foto de menor ordem", () => {
    const url = pickCoverUrl([
      { url: "b.jpg", display_order: 2, media_type: "image" },
      { url: "a.jpg", display_order: 1, media_type: "image" },
    ]);
    expect(url).toBe("a.jpg");
  });
  it("ignora vídeo", () => {
    const url = pickCoverUrl([
      { url: "v.mp4", display_order: 0, media_type: "video" },
      { url: "a.jpg", display_order: 1, media_type: "image" },
    ]);
    expect(url).toBe("a.jpg");
  });
  it("sem foto retorna null", () => {
    expect(pickCoverUrl([])).toBeNull();
    expect(pickCoverUrl([{ url: "v.mp4", display_order: 0, media_type: "video" }])).toBeNull();
  });
});

describe("escapeSearchTerm", () => {
  it("escapa coringas do LIKE", () => {
    expect(escapeSearchTerm("100%_ok")).toBe("100\\%\\_ok");
  });
  it("remove espaços das pontas e limita o tamanho", () => {
    expect(escapeSearchTerm("  camiseta  ")).toBe("camiseta");
    expect(escapeSearchTerm("a".repeat(200)).length).toBe(80);
  });
});
