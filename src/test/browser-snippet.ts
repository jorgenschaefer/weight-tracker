import { runInNewContext } from "node:vm";

/** What a browser snippet did when run on a page at a URL. */
export type SnippetRun = {
  /** What the snippet threw, if it threw. */
  thrown: unknown;
  /** The page's `window`, with whatever the snippet put on it. */
  window: Record<string, unknown>;
  /** Each write to `localStorage`, in order: "set key", "remove key", "clear". */
  written: string[];
};

/**
 * Runs the browser snippet `code` as if pasted on a page at `url`, with an
 * empty `localStorage` that records its writes and `globals` on `window`.
 */
export function runSnippet(
  code: string,
  url: string,
  globals: Record<string, unknown> = {},
): SnippetRun {
  const { hostname, host, port } = new URL(url);
  const written: string[] = [];
  const localStorage = {
    getItem: () => null,
    setItem: (key: string) => written.push(`set ${key}`),
    removeItem: (key: string) => written.push(`remove ${key}`),
    clear: () => written.push("clear"),
  };
  const window: Record<string, unknown> = {
    location: { hostname, host, port },
    localStorage,
    setTimeout,
    ...globals,
  };
  window.window = window;
  let thrown: unknown;
  try {
    runInNewContext(code, window);
  } catch (error) {
    thrown = error;
  }
  return { thrown, window, written };
}
