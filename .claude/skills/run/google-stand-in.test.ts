import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
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

  describe("on a fetch", () => {
    afterEach(() => vi.useRealTimers());

    /** Asks the stand-in in `window` for the measurements since `from`. */
    const fetchSince = (window: Record<string, unknown>, from: string) => {
      const filter = `weight.sample_time.physical_time >= "${from}"`;
      const fetch = window.fetch as typeof globalThis.fetch;
      return fetch(
        `https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints?filter=${encodeURIComponent(filter)}`,
        { headers: { Authorization: "Bearer stand-in-1" } },
      ).then((response) => response.json());
    };

    it("answers the older measurements after olderDelayMs, the others after delayMs, each with the measurements since its beginning", async () => {
      vi.useFakeTimers();
      const { globals } = pageGlobals();
      const { window } = runSnippet(code, "http://walk.localhost:3000/", {
        ...globals,
        Headers,
        Response,
        URL,
      });
      await vi.advanceTimersByTimeAsync(0);
      Object.assign(window.standIn as object, {
        delayMs: 10,
        olderDelayMs: 1000,
        measurements: [
          { time: "2025-06-02T05:00:00.000Z", kg: 110 },
          { time: "2026-10-17T05:00:00.000Z", kg: 95 },
        ],
      });

      let older: { dataPoints: unknown[] } | undefined;
      let recent: { dataPoints: unknown[] } | undefined;
      void fetchSince(window, "2000-01-01T00:00:00.000Z").then((body) => {
        older = body;
      });
      void fetchSince(window, "2026-07-19T08:00:00.000Z").then((body) => {
        recent = body;
      });

      await vi.advanceTimersByTimeAsync(10);
      expect(recent?.dataPoints).toHaveLength(1);
      expect(older).toBeUndefined();
      await vi.advanceTimersByTimeAsync(990);
      expect(older?.dataPoints).toHaveLength(2);
    });
  });
});
