import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { runSnippet } from "@/test/browser-snippet";

const code = readFileSync(
  new URL("./google-stand-in.js", import.meta.url),
  "utf8",
);

/** A loaded Google Identity Services and a fetch, as the page has them. */
function pageGlobals() {
  const initTokenClient = () => ({});
  const fetch = () => Promise.reject(new Error("no network in tests"));
  return {
    initTokenClient,
    fetch,
    globals: { google: { accounts: { oauth2: { initTokenClient } } }, fetch },
  };
}

describe("google-stand-in.js", () => {
  it.each([
    ["http://localhost:3000/", "http://walk.localhost:3000"],
    ["http://127.0.0.1:3001/", "http://walk.localhost:3001"],
    [
      "https://gewicht.jorgenschaefer.de/",
      "http://walk.localhost:<port of the dev server, in .next/dev/lock>",
    ],
  ])(
    "refuses on %s before it replaces anything, naming %s (AC-3)",
    async (url, walkUrl) => {
      const { initTokenClient, fetch, globals } = pageGlobals();
      const { thrown, window, written } = runSnippet(code, url, globals);
      await new Promise((resolve) => setTimeout(resolve));

      expect((thrown as Error).message).toContain(
        ` - open ${walkUrl} and run it there`,
      );
      expect(written).toEqual([]);
      expect(window.fetch).toBe(fetch);
      expect(globals.google.accounts.oauth2.initTokenClient).toBe(
        initTokenClient,
      );
      expect(window.standIn).toBeUndefined();
      expect(window.standInReopen).toBeUndefined();
    },
  );

  it("puts itself in place of Google on walk.localhost", async () => {
    const { initTokenClient, fetch, globals } = pageGlobals();
    const { thrown, window } = runSnippet(
      code,
      "http://walk.localhost:3000/",
      globals,
    );
    await vi.waitFor(() => expect(window.standIn).toBeDefined());

    expect(thrown).toBeUndefined();
    expect(window.fetch).not.toBe(fetch);
    expect(globals.google.accounts.oauth2.initTokenClient).not.toBe(
      initTokenClient,
    );
    expect(window.standInReopen).toBeTypeOf("function");
  });
});
