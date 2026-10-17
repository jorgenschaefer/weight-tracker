import { describe, expect, it, vi } from "vitest";
import { metadata } from "./layout";

// next/font is a compiler transform that only next build and next dev run.
vi.mock("next/font/google", () => ({
  Archivo: () => ({ className: "archivo", style: { fontFamily: "Archivo" } }),
}));

describe("root layout metadata", () => {
  it("keeps every page out of search engines", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
