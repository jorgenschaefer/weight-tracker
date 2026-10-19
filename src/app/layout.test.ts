import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { metadata, viewport } from "./layout";

// next/font is a compiler transform that only next build and next dev run.
vi.mock("next/font/google", () => ({
  Archivo: () => ({ className: "archivo", style: { fontFamily: "Archivo" } }),
}));

describe("root layout metadata", () => {
  it("keeps every page out of search engines", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("root layout viewport", () => {
  it("shrinks the page above the phone's keyboard, so the sheet's field and „Eintragen“ stay above it", () => {
    expect(viewport.interactiveWidget).toBe("resizes-content");
  });
});

// Next.js links the favicons into every page from these two files.
describe("the favicon", () => {
  it("puts the scale on a grey tile, so it shows on dark browser bars too", () => {
    const svg = readFileSync("src/app/icon.svg", "utf8");

    expect(svg).toContain('viewBox="0 0 48 48"');
    expect(svg).toMatch(/<rect width="48" height="48" [^>]*fill="#DDE1E5"/);
  });

  it("has an .ico at 16, 32 and 48 px for browsers that do not take the SVG", () => {
    expect(icoSizes(readFileSync("src/app/favicon.ico"))).toEqual([16, 32, 48]);
  });
});

/** The widths of the images in the ICO file `ico`, from its directory. */
function icoSizes(ico: Buffer): number[] {
  const count = ico.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => ico.readUInt8(6 + 16 * i));
}
