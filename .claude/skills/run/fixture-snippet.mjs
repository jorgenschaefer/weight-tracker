// Prints a browser snippet that stores the test data under `walk:fixture` in
// the page's localStorage on http://walk.localhost:<port>, and refuses on any
// other host. Paste it once per browser profile.
// Usage: node .claude/skills/run/fixture-snippet.mjs
import { readFileSync } from "node:fs";

// The extract and the days the tests add to it, as `weightHistoryUntil` in
// `src/test/weight-history-fixture.ts` has them.
const rows = ["gewicht-2026-07-bis-10.csv", "gewicht-2026-10-18-bis-20.csv"]
  .map((name) => new URL(`../../../src/test/fixtures/${name}`, import.meta.url))
  .flatMap((csv) =>
    readFileSync(csv, "utf8")
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => {
        const [day, kg] = line.split(",");
        return { day, kg: Number(kg) };
      }),
  );
// The check of the host comes first in the snippet, so that on any other
// host it throws before it writes anything.
const onlyOnWalkLocalhost = `if (location.hostname !== "walk.localhost") throw new Error(\`The snippet of fixture-snippet.mjs runs only on walk.localhost, to keep the localStorage of \${location.host} as it is - open http://walk.localhost\${location.port ? ":" + location.port : ":<port of the dev server, in .next/dev/lock>"} and run it there\`);`;
console.log(
  `${onlyOnWalkLocalhost} localStorage.setItem("walk:fixture", ${JSON.stringify(JSON.stringify(rows))}); "stored ${rows.length} days"`,
);
