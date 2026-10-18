import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { metadata } from "./layout";
import manifest from "./manifest";

// next/font is a compiler transform that only next build and next dev run.
vi.mock("next/font/google", () => ({
  Archivo: () => ({ className: "archivo", style: { fontFamily: "Archivo" } }),
}));

describe("the web app manifest", () => {
  it("installs the page as the app „Gewicht“, in a window of its own", () => {
    expect(manifest()).toMatchObject({
      name: "Gewicht",
      short_name: "Gewicht",
      lang: "de",
      display: "standalone",
    });
  });

  it("describes the app as the page's metadata does", () => {
    expect(manifest().description).toBe(metadata.description);
  });

  it("keeps the identity Android knows the installed app by", () => {
    expect(manifest()).toMatchObject({ id: "/", start_url: "/" });
  });

  it("starts on the neutral surface, in its colour", () => {
    expect(manifest()).toMatchObject({
      background_color: "#DDE1E5",
      theme_color: "#DDE1E5",
    });
  });

  it("has the scale at 192 and 512 px, and one to fill the launcher's shape", () => {
    expect(manifest().icons).toEqual([
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("finds each icon in public/ at the size it names", () => {
    for (const icon of manifest().icons ?? []) {
      expect(`${icon.src} ${pngSize(icon.src)}`).toBe(
        `${icon.src} ${icon.sizes}`,
      );
    }
  });
});

/** Width × height of the PNG served at `src`, from its IHDR chunk. */
function pngSize(src: string): string {
  const png = readFileSync(join("public", src));
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}
