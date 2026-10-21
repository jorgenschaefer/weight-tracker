import { runInNewContext } from "node:vm";

/** What a browser snippet did when run on a page at a URL. */
export type SnippetRun = {
  /** What the snippet threw, if it threw. */
  thrown: unknown;
  /** The page's `window`, with whatever the snippet put on it. */
  window: Record<string, unknown>;
  /** Each write to `localStorage`, in order: "set key", "remove key", "clear". */
  written: string[];
  /** The value of each key last set with `localStorage.setItem`. */
  stored: Record<string, string>;
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
  const stored: Record<string, string> = {};
  const methods: Record<string, unknown> = {
    getItem: () => null,
    setItem: (key: string, value: string) => {
      written.push(`set ${key}`);
      stored[key] = value;
    },
    removeItem: (key: string) => written.push(`remove ${key}`),
    clear: () => written.push("clear"),
  };
  // Records writes as properties too: `localStorage[key] = value`, `delete`.
  const localStorage = new Proxy(methods, {
    set: (_, key) => {
      written.push(`set ${String(key)}`);
      return true;
    },
    deleteProperty: (_, key) => {
      written.push(`remove ${String(key)}`);
      return true;
    },
  });
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
  return { thrown, window, written, stored };
}
