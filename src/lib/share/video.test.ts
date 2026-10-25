import { describe, expect, it } from "vitest";
import { pickShareVideo } from "./video";

describe("pickShareVideo", () => {
  it("escolhe o vídeo de menor ordem", () => {
    expect(pickShareVideo([
      { url: "b.mp4", media_type: "video", display_order: 2 },
      { url: "a.mp4", media_type: "video", display_order: 1 },
    ])).toBe("a.mp4");
  });
  it("ignora fotos", () => {
    expect(pickShareVideo([
      { url: "foto.jpg", media_type: "image", display_order: 0 },
      { url: "v.mp4", media_type: "video", display_order: 1 },
    ])).toBe("v.mp4");
  });
  it("sem vídeo retorna null", () => {
    expect(pickShareVideo([{ url: "foto.jpg", media_type: "image", display_order: 0 }])).toBeNull();
    expect(pickShareVideo([])).toBeNull();
  });
  it("ignora vídeo sem endereço", () => {
    expect(pickShareVideo([{ url: "", media_type: "video", display_order: 0 }])).toBeNull();
  });
});
