import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkDomainBoundaries } from "./domain-boundaries";
import { repositoryFiles } from "./test-files";

describe("the repository", () => {
  it("keeps the rules: domain code runs anywhere, and only src/app/ reads the clock", () => {
    const files = repositoryFiles(process.cwd())
      .filter((path) => /\.tsx?$/.test(path))
      .map((path) => ({ path, source: readFileSync(path, "utf8") }));

    expect(checkDomainBoundaries(files)).toEqual([]);
  });
});

describe("checkDomainBoundaries: imports between directories", () => {
  it("refuses an import of src/app/ from src/measurement/", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/gap.ts",
          source: 'import { page } from "@/app/page";\n',
        },
      ]),
    ).toEqual([
      'src/measurement/gap.ts: imports "@/app/page" from src/app/ - src/measurement/ may import only from itself; move what it needs into src/measurement/',
    ]);
  });

  it.each([
    ["a relative import", 'import { page } from "../app/page";'],
    ["a side-effect import", 'import "@/app/globals";'],
    ["a dynamic import", 'const page = await import("@/app/page");'],
    ["a re-export", 'export { page } from "../app/page";'],
    [
      "a type import over two lines",
      'import type {\n  Page,\n} from "@/app/page";',
    ],
  ])("refuses an import of src/app/ in %s", (_, source) => {
    expect(
      checkDomainBoundaries([{ path: "src/measurement/gap.ts", source }]),
    ).toHaveLength(1);
  });

  it("refuses an import of src/test/ from domain code that is no test", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/gap.ts",
          source: 'import { fixture } from "@/test/fixture";',
        },
      ]),
    ).toEqual([
      'src/measurement/gap.ts: imports "@/test/fixture" from src/test/ - src/measurement/ may import only from itself; move what it needs into src/measurement/',
    ]);
  });

  it("names src/test/ as allowed in the message for a test", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/gap.test.ts",
          source: 'import { page } from "@/app/page";',
        },
      ]),
    ).toEqual([
      'src/measurement/gap.test.ts: imports "@/app/page" from src/app/ - src/measurement/ may import only from itself, src/test/; move what it needs into src/measurement/',
    ]);
  });

  it("accepts imports within a domain directory, of packages, and of src/test/ in tests", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/gap.ts",
          source:
            'import { posix } from "node:path";\nimport type { CalendarDay } from "./calendar-day";\nimport { berlinDay } from "@/measurement/calendar-day";',
        },
        {
          path: "src/measurement/gap.test.ts",
          source:
            'import { describe } from "vitest";\nimport { fixture } from "@/test/fixture";\nimport { findGaps } from "./gap";',
        },
      ]),
    ).toEqual([]);
  });

  it("accepts imports of the domain from src/app/ and from outside src/", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/app/page.tsx",
          source: 'import { findGaps } from "@/measurement/gap";',
        },
        {
          path: "next.config.ts",
          source: 'import { CACHE_KEY } from "./src/measurement/cache";',
        },
      ]),
    ).toEqual([]);
  });
});

describe("checkDomainBoundaries: React, Next.js and the browser", () => {
  it.each([
    ["react", 'import { useState } from "react";'],
    ["react-dom", 'import { createPortal } from "react-dom";'],
    ["a subpath of react", 'import { jsx } from "react/jsx-runtime";'],
    ["next", 'import type { NextConfig } from "next";'],
    ["a subpath of next", 'import { headers } from "next/headers";'],
    ["Mantine", 'import { Button } from "@mantine/core";'],
  ])("refuses an import of %s in domain code", (_, source) => {
    expect(
      checkDomainBoundaries([{ path: "src/measurement/gap.ts", source }]),
    ).toEqual([
      `src/measurement/gap.ts: imports "${/"(.+)"/.exec(source)?.[1]}" - code in src/measurement/ uses no React, Next.js or Mantine; move what needs it into src/app/`,
    ]);
  });

  it.each([
    ["localStorage", 'localStorage.getItem("gewicht:v1");'],
    ["sessionStorage", "sessionStorage.clear();"],
    ["window", 'window.addEventListener("storage", reload);'],
    ["document", "document.title = title;"],
    ["navigator", "const online = navigator.onLine;"],
    ["location", "location.reload();"],
    ["history", "history.back();"],
    ["fetch", "const response = await fetch(url);"],
    ["XMLHttpRequest", "new XMLHttpRequest();"],
    ["indexedDB", "indexedDB.open(name);"],
    ["localStorage", 'globalThis.localStorage.getItem("gewicht:v1");'],
  ])("refuses the browser's %s in domain code", (name, source) => {
    expect(
      checkDomainBoundaries([{ path: "src/measurement/gap.ts", source }]),
    ).toEqual([
      `src/measurement/gap.ts: uses the browser's ${name} - code in src/measurement/ uses no browser API; move what needs it into src/app/ and pass in what it yields`,
    ]);
  });

  it("accepts the browser's names in comments, strings, properties and longer names", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/cache.ts",
          source: [
            "/** The `localStorage` key of the cache. */",
            "// read by the window of the page",
            'export const CACHE_KEY = "gewicht:v1 document";',
            "const text = `fetch the document`;",
            "const day = cache.location;",
            "const fetchedAt = cache.fetchedAt;",
          ].join("\n"),
        },
      ]),
    ).toEqual([]);
  });

  it("leaves React, Next.js and the browser to src/app/ and to tests", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/app/page.tsx",
          source:
            'import { useState } from "react";\nlocalStorage.getItem(key);',
        },
        {
          path: "src/measurement/gap.test.ts",
          source:
            'import { render } from "@testing-library/react";\nwindow.scrollTo(0, 0);',
        },
      ]),
    ).toEqual([]);
  });
});

describe("checkDomainBoundaries: the clock", () => {
  it.each([
    ["Date.now()", "const now = Date.now();"],
    ["Date.now passed along", "const read = (clock = Date.now) => clock();"],
    [
      "performance.now passed along",
      "const read = (clock = performance.now) => clock();",
    ],
    ["new Date()", "const now = new Date();"],
    ["new Date without parentheses", "const now = new Date;"],
    ["performance.now()", "const start = performance.now();"],
    ["Temporal.Now", "const today = Temporal.Now.plainDateISO();"],
    ["Date() without new", "const now = Date();"],
    ["globalThis.Date.now()", "const now = globalThis.Date.now();"],
  ])("refuses reading the clock with %s outside src/app/", (_, source) => {
    expect(
      checkDomainBoundaries([{ path: "src/measurement/gap.ts", source }]),
    ).toEqual([
      "src/measurement/gap.ts: reads the clock - only code in src/app/ reads it; take the time as a parameter instead",
    ]);
  });

  it("refuses reading the clock anywhere outside src/app/, not only in domain code", () => {
    expect(
      checkDomainBoundaries([
        { path: "src/test/fixture.ts", source: "const now = new Date();" },
      ]),
    ).toEqual([
      "src/test/fixture.ts: reads the clock - only code in src/app/ reads it; take the time as a parameter instead",
    ]);
  });

  it("refuses reading the clock in a test, which would run differently each day", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/gap.test.ts",
          source: "const now = Date.now();",
        },
      ]),
    ).toEqual([
      "src/measurement/gap.test.ts: reads the clock - only code in src/app/ reads it; take the time as a parameter instead",
    ]);
  });

  it("accepts a time made from a value, the clock in src/app/, and the clock in comments", () => {
    expect(
      checkDomainBoundaries([
        {
          path: "src/measurement/cache.ts",
          source:
            "// never new Date() here\nconst time = new Date(stored);\nconst start = new Date(now.getTime() - days);",
        },
        { path: "src/app/page.tsx", source: "const now = new Date();" },
      ]),
    ).toEqual([]);
  });
});
