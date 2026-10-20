import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runSnippet } from "@/test/browser-snippet";

const snippet = execFileSync(
  process.execPath,
  [fileURLToPath(new URL("./fixture-snippet.mjs", import.meta.url))],
  { encoding: "utf8" },
);

describe("the snippet fixture-snippet.mjs prints", () => {
  it.each([
    ["http://localhost:3000/", "http://walk.localhost:3000"],
    ["http://127.0.0.1:3001/", "http://walk.localhost:3001"],
    [
      "https://gewicht.jorgenschaefer.de/",
      "http://walk.localhost:<port of the dev server, in .next/dev/lock>",
    ],
  ])(
    "refuses on %s before it stores anything, naming %s (AC-3)",
    (url, walkUrl) => {
      const { thrown, written } = runSnippet(snippet, url);

      expect((thrown as Error).message).toContain(
        ` - open ${walkUrl} and run it there`,
      );
      expect(written).toEqual([]);
    },
  );

  it("stores the test data under walk:fixture on walk.localhost", () => {
    const { thrown, written } = runSnippet(
      snippet,
      "http://walk.localhost:3000/",
    );

    expect(thrown).toBeUndefined();
    expect(written).toEqual(["set walk:fixture"]);
  });
});
