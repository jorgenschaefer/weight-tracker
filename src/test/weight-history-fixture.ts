import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Measurement } from "@/measurement/measurement";

/**
 * The user's weight from 1.7. to 17.10.2026 (`fixtures/gewicht-2026-07-bis-10.csv`,
 * rows `datum,kg`), one measurement a day. The extract has no times, so each
 * is taken at 7:00 in Berlin.
 */
export function weightHistory(): Measurement[] {
  return readFileSync(FIXTURE, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => {
      const [day, kg] = row.split(",");
      return { time: new Date(`${day}T07:00:00+02:00`), kg: Number(kg) };
    });
}

// A path, not a URL from `import.meta.url`: under jsdom that is no file URL.
const FIXTURE = join(
  import.meta.dirname,
  "fixtures",
  "gewicht-2026-07-bis-10.csv",
);
