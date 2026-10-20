import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

/**
 * The rule of the test layout, checked over `files` (the paths
 * {@link repositoryFiles} lists): every test file has a source file of the
 * same name beside it, and no source file has two. Returns one message per
 * violation, each naming the file at fault and the fix.
 */
export function checkTestFiles(files: string[]): string[] {
  const listed = new Set(files);
  return [
    ...files
      .filter(isTestFile)
      .flatMap((test) => testFileWithoutSource(test, listed)),
    ...files
      .filter((file) => !isTestFile(file))
      .flatMap((source) => sourceWithTwoTestFiles(source, listed)),
  ];
}

/**
 * The files of the git repository in `dir`, relative to it: tracked ones and
 * new ones not yet added, so a file is checked before its first commit;
 * ignored and deleted ones are left out.
 */
export function repositoryFiles(dir: string): string[] {
  return execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: dir, encoding: "utf8" },
  )
    .split("\0")
    .filter((file) => file !== "" && existsSync(join(dir, file)));
}

const TEST_FILE = /^(.*)\.test\.(tsx?)$/;

/**
 * The source extensions a test file of each extension may test; a `.test.ts`
 * also tests a browser snippet in `.js` or `.mjs`.
 */
const SOURCE_EXTENSIONS: Record<string, string[]> = {
  ts: ["ts", "tsx", "js", "mjs"],
  tsx: ["ts", "tsx"],
};

function isTestFile(file: string): boolean {
  return TEST_FILE.test(file);
}

function testFileWithoutSource(test: string, listed: Set<string>): string[] {
  const [, stem, extension] = TEST_FILE.exec(test) as RegExpExecArray;
  const extensions = SOURCE_EXTENSIONS[extension];
  if (extensions.some((source) => listed.has(`${stem}.${source}`))) return [];

  const names = extensions.map((source) => `${basename(stem)}.${source}`);
  const missing = `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
  return [
    `${test}: no source file ${missing} beside it - move each test into the test file of the source file whose behaviour it tests${example(stem, extension, listed)}`,
  ];
}

function sourceWithTwoTestFiles(source: string, listed: Set<string>): string[] {
  const tests = testFilesOf(source, listed);
  if (tests.length < 2) return [];

  const sameExtension = source.replace(/\.(\w+)$/, ".test.$1");
  const keep = tests.includes(sameExtension) ? sameExtension : tests[0];
  const merge = tests.filter((test) => test !== keep).join(" and ");
  return [
    `${source}: two test files, ${tests.join(" and ")} - merge ${merge} into ${keep}`,
  ];
}

/** The listed test files beside `source` that are named after it. */
function testFilesOf(source: string, listed: Set<string>): string[] {
  const match = /^(.*)\.(tsx?)$/.exec(source);
  if (!match) return [];
  const [, stem, extension] = match;
  return SOURCE_EXTENSIONS[extension]
    .map((ext) => `${stem}.test.${ext}`)
    .filter((test) => listed.has(test));
}

/**
 * For a topic test file `Foo.bar.test.tsx`, the nearest source of a shorter
 * name (`Foo.tsx`) and the test file its tests would move into.
 */
function example(stem: string, extension: string, listed: Set<string>): string {
  const dir = dirname(stem);
  const parts = basename(stem).split(".");
  for (let n = parts.length - 1; n > 0; n--) {
    const shorter = join(dir, parts.slice(0, n).join("."));
    const source = SOURCE_EXTENSIONS[extension]
      .map((ext) => `${shorter}.${ext}`)
      .find((file) => listed.has(file));
    if (!source) continue;
    const test =
      testFilesOf(source, listed)[0] ?? `${shorter}.test.${extension}`;
    return `, such as ${test} for ${source}`;
  }
  return "";
}
