import { posix } from "node:path";

/** A file of the repository, by its path relative to the root, and its text. */
export interface SourceFile {
  path: string;
  source: string;
}

/**
 * The rules that keep the domain directories free to run anywhere, checked
 * over `files`. Returns one message per violation, each naming the file at
 * fault and the fix.
 *
 * A domain directory imports only from itself, from the directories below it
 * in {@link DOMAIN_IMPORTS}, and in its tests from `src/test/`. Its code, tests
 * aside, uses no React, Next.js, Mantine or browser API, except that
 * {@link GOOGLE_MODULE} talks to Google from the browser. Only `src/app/`
 * reads the clock; not even a test does, so it runs the same on every day.
 */
export function checkDomainBoundaries(files: SourceFile[]): string[] {
  return files.flatMap((file) => [
    ...importsAcrossTheBoundary(file),
    ...frameworksInTheDomain(file),
    ...browserInTheDomain(file),
    ...clockOutsideTheApp(file),
  ]);
}

/**
 * The domain directories under `src/`, each with the directories it may
 * import from besides itself. `src/app/` sits above all of them.
 */
const DOMAIN_IMPORTS: Record<string, string[]> = {
  measurement: [],
};

/** The one module that talks to Google; it alone may use the browser. */
const GOOGLE_MODULE = "src/measurement/google-health.ts";

const TEST_FILE = /\.test\.tsx?$/;

const FRAMEWORK = /^(react|react-dom|next)(\/|$)|^@mantine\//;

const BROWSER_GLOBAL =
  /(?<![\w$.])(window|document|navigator|location|history|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest)(?![\w$])/g;

const CLOCK =
  /(?<![\w$.])(Date\.now\b|new\s+Date\s*(\(\s*\)|(?![\s(]))|(?<!new\s+)Date\s*\(|performance\.now\b|Temporal\.Now\b)/;

function importsAcrossTheBoundary({ path, source }: SourceFile): string[] {
  const directory = domainDirectory(path);
  if (directory === null) return [];

  const allowed = [directory, ...DOMAIN_IMPORTS[directory]];
  if (TEST_FILE.test(path)) allowed.push("test");
  return importSpecifiers(source).flatMap((specifier) => {
    const imported = srcDirectory(resolve(path, specifier));
    if (imported === null || allowed.includes(imported)) return [];
    const others = allowed.slice(1).map((dir) => `src/${dir}/`);
    const from =
      others.length === 0 ? "itself" : `itself, ${others.join(", ")}`;
    return [
      `${path}: imports "${specifier}" from src/${imported}/ - src/${directory}/ may import only from ${from}; move what it needs into src/${directory}/`,
    ];
  });
}

function frameworksInTheDomain({ path, source }: SourceFile): string[] {
  const directory = domainDirectory(path);
  if (directory === null || TEST_FILE.test(path)) return [];

  return importSpecifiers(source)
    .filter((specifier) => FRAMEWORK.test(specifier))
    .map(
      (specifier) =>
        `${path}: imports "${specifier}" - code in src/${directory}/ uses no React, Next.js or Mantine; move what needs it into src/app/`,
    );
}

function browserInTheDomain({ path, source }: SourceFile): string[] {
  const directory = domainDirectory(path);
  if (directory === null || TEST_FILE.test(path) || path === GOOGLE_MODULE) {
    return [];
  }

  const code = globalCode(source);
  const names = new Set(
    [...code.matchAll(BROWSER_GLOBAL)].map(([name]) => name),
  );
  return [...names].map(
    (name) =>
      `${path}: uses the browser's ${name} - code in src/${directory}/ uses no browser API; move what needs it into src/app/ and pass in what it yields`,
  );
}

function clockOutsideTheApp({ path, source }: SourceFile): string[] {
  if (path.startsWith("src/app/")) return [];
  if (!CLOCK.test(globalCode(source))) return [];
  return [
    `${path}: reads the clock - only code in src/app/ reads it; take the time as a parameter instead`,
  ];
}

/** The modules `source` imports or re-exports, as written. */
function importSpecifiers(source: string): string[] {
  const pattern =
    /(?:\bimport|\bexport)\s*(?:[^"'`;]*?\bfrom\s*)?\(?\s*["']([^"']+)["']/g;
  return [...codeOf(source, { keepStrings: true }).matchAll(pattern)].map(
    ([, specifier]) => specifier,
  );
}

/**
 * The code of `source`, without strings and with `globalThis.` dropped, so a
 * global reads the same however it is reached.
 */
function globalCode(source: string): string {
  return codeOf(source, { keepStrings: false }).replace(
    /(?<![\w$.])globalThis\s*\.\s*/g,
    "",
  );
}

/**
 * The code of `source`: without its comments and, unless `keepStrings`, with
 * every string and template literal emptied.
 */
function codeOf(
  source: string,
  { keepStrings }: { keepStrings: boolean },
): string {
  const commentOrString =
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g;
  return source.replace(commentOrString, (match) => {
    if (match.startsWith("/")) return "";
    return keepStrings ? match : '""';
  });
}

/** The domain directory under `src/` that holds `path`, if any. */
function domainDirectory(path: string): string | null {
  const directory = srcDirectory(path);
  return directory !== null && directory in DOMAIN_IMPORTS ? directory : null;
}

/**
 * The repository path `specifier` names when imported from `path`; a package
 * name stays as it is.
 */
function resolve(path: string, specifier: string): string {
  if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`;
  if (specifier.startsWith(".")) {
    return posix.join(posix.dirname(path), specifier);
  }
  return specifier;
}

/** The directory directly under `src/` that holds `path`, if any. */
function srcDirectory(path: string): string | null {
  const match = /^src\/([^/]+)\//.exec(path);
  return match === null ? null : match[1];
}
