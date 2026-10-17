// Prints a browser snippet that stores the test data under `walk:fixture` in
// the page's localStorage. Paste it once per browser profile.
// Usage: node .claude/skills/run/fixture-snippet.mjs
import { readFileSync } from "node:fs";

const csv = new URL(
  "../../../src/test/fixtures/gewicht-2026-07-bis-10.csv",
  import.meta.url,
);
const rows = readFileSync(csv, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [day, kg] = line.split(",");
    return { day, kg: Number(kg) };
  });
console.log(
  `localStorage.setItem("walk:fixture", ${JSON.stringify(JSON.stringify(rows))}); "stored ${rows.length} days"`,
);
