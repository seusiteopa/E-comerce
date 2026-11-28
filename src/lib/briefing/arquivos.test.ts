import { describe, expect, it } from "vitest";
import { fileInputSchema, isCloudinaryUrl, mediaTypeOf } from "./arquivos";

describe("isCloudinaryUrl", () => {
  it("aceita só endereços do Cloudinary", () => {
    expect(isCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/v1/a.png")).toBe(true);
    expect(isCloudinaryUrl("https://evil.com/res.cloudinary.com/x.png")).toBe(false);
    expect(isCloudinaryUrl("http://res.cloudinary.com/demo/a.png")).toBe(false);
  });
});

describe("fileInputSchema", () => {
  it("recusa tipo e endereço inválidos", () => {
    expect(fileInputSchema.safeParse({ url: "https://res.cloudinary.com/demo/a.png", mediaType: "imagem" }).success).toBe(true);
    expect(fileInputSchema.safeParse({ url: "https://exemplo.com/a.png", mediaType: "imagem" }).success).toBe(false);
    expect(fileInputSchema.safeParse({ url: "https://res.cloudinary.com/demo/a.png", mediaType: "musica" }).success).toBe(false);
  });
});

describe("mediaTypeOf", () => {
  it("classifica pelo tipo do arquivo", () => {
    expect(mediaTypeOf("image/png")).toBe("imagem");
    expect(mediaTypeOf("video/mp4")).toBe("video");
    expect(mediaTypeOf("application/pdf")).toBe("arquivo");
  });
});
