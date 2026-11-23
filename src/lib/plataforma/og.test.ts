import { describe, expect, it } from "vitest";
import { parseImageDataUrl } from "./og";

describe("parseImageDataUrl", () => {
  it("aceita PNG em base64", () => {
    const r = parseImageDataUrl("data:image/png;base64,iVBORw0KGgo=");
    expect(r?.type).toBe("image/png");
    expect(r?.bytes.length).toBeGreaterThan(0);
  });
  it("recusa tipo que não é imagem aceita", () => {
    expect(parseImageDataUrl("data:text/html;base64,PGh0bWw+")).toBeNull();
    expect(parseImageDataUrl("não é imagem")).toBeNull();
  });
});
