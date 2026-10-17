import { vi } from "vitest";

/**
 * jsdom lays nothing out: from now on every element observed for its size
 * reports `width`. Undone by `vi.unstubAllGlobals()`.
 */
export function stubContainerWidth(width: number) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly report: ResizeObserverCallback) {}
      observe() {
        // Safe: the graph reads only these two fields of an entry, and no
        // field of the observer.
        this.report(
          [
            {
              borderBoxSize: [{ inlineSize: width, blockSize: 0 }],
              contentRect: { width, height: 0 },
            } as unknown as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );
}
