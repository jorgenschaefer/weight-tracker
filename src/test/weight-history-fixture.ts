import { readFileSync } from "node:fs";
import { join } from "node:path";
import { berlinDay } from "@/measurement/calendar-day";
import type { Measurement } from "@/measurement/measurement";

/**
 * The user's weight from 1.7. to 17.10.2026 (`fixtures/gewicht-2026-07-bis-10.csv`,
 * rows `datum,kg`), one measurement a day. The extract has no times, so each
 * is taken at 7:00 in Berlin.
 */
export function weightHistory(): Measurement[] {
  return readFixture("gewicht-2026-07-bis-10.csv");
}

/**
 * 18.10. to 20.10.2026, which the extract lacks. `analysis/kalman/reference.py`
 * and the `run` skill's `fixture-snippet.mjs` read the same file.
 */
const october18To20 = () => readFixture("gewicht-2026-10-18-bis-20.csv");

/**
 * The user's weight with 18.10. to 20.10., up to `lastDay` and any
 * `extra` measurements up to it besides.
 */
export function weightHistoryUntil(
  lastDay: string,
  extra: Measurement[] = [],
): Measurement[] {
  return [...weightHistory(), ...october18To20(), ...extra].filter(
    (measurement) => berlinDay(measurement.time) <= lastDay,
  );
}

function readFixture(name: string): Measurement[] {
  // A path, not a URL from `import.meta.url`: under jsdom that is no file URL.
  return readFileSync(join(import.meta.dirname, "fixtures", name), "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => {
      const [day, kg] = row.split(",");
      return { time: new Date(`${day}T07:00:00+02:00`), kg: Number(kg) };
    });
}
