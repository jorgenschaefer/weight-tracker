import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runSnippet } from "@/test/browser-snippet";

const code = readFileSync(new URL("./walk-on.js", import.meta.url), "utf8");

describe("walk-on.js", () => {
  it.each([
    ["http://localhost:3000/", "http://walk.localhost:3000"],
    ["http://127.0.0.1:3001/", "http://walk.localhost:3001"],
    [
      "https://gewicht.jorgenschaefer.de/",
      "http://walk.localhost:<port of the dev server, in .next/dev/lock>",
    ],
  ])(
    "refuses on %s before it touches anything, naming %s (AC-3)",
    (url, walkUrl) => {
      const { thrown, window, written } = runSnippet(code, url);

      expect((thrown as Error).message).toContain(
        ` - open ${walkUrl} and run it there`,
      );
      expect(written).toEqual([]);
      expect(window.walkOn).toBeUndefined();
    },
  );

  it("defines walkOn on walk.localhost", () => {
    const { thrown, window, written } = runSnippet(
      code,
      "http://walk.localhost:3000/",
    );

    expect(thrown).toBeUndefined();
    expect(window.walkOn).toBeTypeOf("function");
    expect(written).toEqual([]);
  });

  it.each([
    ["2026-01-15", "2026-01-15T06:00:00.000Z"],
    ["2026-07-15", "2026-07-15T05:00:00.000Z"],
    ["2026-03-29", "2026-03-29T05:00:00.000Z"],
    ["2026-10-25", "2026-10-25T06:00:00.000Z"],
  ])(
    "stores the measurement of %s at 7:00 in Berlin, %s",
    async (day, time) => {
      const { window, stored } = runSnippet(
        code,
        "http://walk.localhost:3000/",
        { document: documentThatOpensNoFrame() },
      );
      const walkOn = window.walkOn as (
        day: string,
        opts: object,
      ) => Promise<unknown>;

      await expect(walkOn(day, { only: [{ day, kg: 90 }] })).rejects.toThrow(
        NO_FRAME,
      );

      const cache = JSON.parse(stored["gewicht:v1"]);
      expect(cache.measurements).toEqual([{ time, kg: 90 }]);
    },
  );
});

const NO_FRAME = "no frame in this test";

/**
 * A `document` whose frame never reaches the page, so `walkOn` stops once it
 * has stored the cache.
 */
function documentThatOpensNoFrame() {
  return {
    createElement: () => ({ style: {} }),
    body: {
      appendChild: () => {
        throw new Error(NO_FRAME);
      },
    },
  };
}
