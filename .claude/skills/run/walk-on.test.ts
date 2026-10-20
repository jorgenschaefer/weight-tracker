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
});
