import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { checkTestFiles, repositoryFiles } from "./test-files";

describe("the repository", () => {
  it("keeps the rule: every test file pairs with its source", () => {
    const files = repositoryFiles(process.cwd());

    expect(checkTestFiles(files)).toEqual([]);
  });
});

describe("repositoryFiles", () => {
  it("lists the tracked files and the new ones not yet added, by their real names, but no ignored or deleted file", () => {
    const dir = mkdtempSync(join(tmpdir(), "weight-tracker-repo-"));
    onTestFinished(() => rmSync(dir, { recursive: true }));
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir });
    git("init", "--quiet");
    for (const file of [
      ".gitignore",
      "tracked.ts",
      "deleted.ts",
      "new.ts",
      "übung.ts",
    ]) {
      writeFileSync(
        join(dir, file),
        file === ".gitignore" ? "ignored.ts\n" : "",
      );
    }
    writeFileSync(join(dir, "ignored.ts"), "");
    git("add", ".gitignore", "tracked.ts", "deleted.ts");
    rmSync(join(dir, "deleted.ts"));

    expect(repositoryFiles(dir).toSorted()).toEqual([
      ".gitignore",
      "new.ts",
      "tracked.ts",
      "übung.ts",
    ]);
  });
});

describe("checkTestFiles: one test file per source file", () => {
  it("moves a topic test file into the test file of its source", () => {
    expect(
      checkTestFiles(["src/map/Foo.tsx", "src/map/Foo.bar.test.tsx"]),
    ).toEqual([
      "src/map/Foo.bar.test.tsx: no source file Foo.bar.ts or Foo.bar.tsx beside it - move each test into the test file of the source file whose behaviour it tests, such as src/map/Foo.test.tsx for src/map/Foo.tsx",
    ]);
  });

  it("names the existing test file of the source to move into", () => {
    expect(
      checkTestFiles([
        "src/map/Panel.tsx",
        "src/map/Panel.test.ts",
        "src/map/Panel.redirect.test.tsx",
      ]),
    ).toEqual([
      "src/map/Panel.redirect.test.tsx: no source file Panel.redirect.ts or Panel.redirect.tsx beside it - move each test into the test file of the source file whose behaviour it tests, such as src/map/Panel.test.ts for src/map/Panel.tsx",
    ]);
  });

  it("names the test file to move into at the repository root", () => {
    expect(
      checkTestFiles([
        "next.config.ts",
        "next.config.test.ts",
        "next.config.headers.test.ts",
      ]),
    ).toEqual([
      "next.config.headers.test.ts: no source file next.config.headers.ts or next.config.headers.tsx beside it - move each test into the test file of the source file whose behaviour it tests, such as next.config.test.ts for next.config.ts",
    ]);
  });

  it("refuses a test file with no source of any shorter name", () => {
    expect(checkTestFiles(["src/journal/flows.test.ts"])).toEqual([
      "src/journal/flows.test.ts: no source file flows.ts or flows.tsx beside it - move each test into the test file of the source file whose behaviour it tests",
    ]);
  });

  it("accepts a test file beside its source, whatever the two extensions", () => {
    expect(
      checkTestFiles([
        "src/map/Panel.tsx",
        "src/map/Panel.test.ts",
        "next.config.ts",
        "next.config.test.ts",
      ]),
    ).toEqual([]);
  });

  it("refuses two test files for one source", () => {
    expect(
      checkTestFiles([
        "src/map/Foo.tsx",
        "src/map/Foo.test.ts",
        "src/map/Foo.test.tsx",
      ]),
    ).toEqual([
      "src/map/Foo.tsx: two test files, src/map/Foo.test.ts and src/map/Foo.test.tsx - merge src/map/Foo.test.ts into src/map/Foo.test.tsx",
    ]);
  });
});
