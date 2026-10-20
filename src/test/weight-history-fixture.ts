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
  return readFileSync(FIXTURE, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => {
      const [day, kg] = row.split(",");
      return { time: new Date(`${day}T07:00:00+02:00`), kg: Number(kg) };
    });
}

/**
 * 18.10. to 20.10.2026, which the fixture lacks; `analysis/kalman/reference.py`
 * adds the same days, and the two change together.
 */
const OCTOBER_18_TO_20: Measurement[] = [
  { time: new Date("2026-10-18T07:00:00+02:00"), kg: 98.4 },
  { time: new Date("2026-10-19T07:00:00+02:00"), kg: 97.0 },
  { time: new Date("2026-10-20T07:00:00+02:00"), kg: 96.9 },
];

/**
 * The user's weight with 18.10. to 20.10., up to `lastDay` and any
 * `extra` measurements up to it besides.
 */
export function weightHistoryUntil(
  lastDay: string,
  extra: Measurement[] = [],
): Measurement[] {
  return [...weightHistory(), ...OCTOBER_18_TO_20, ...extra].filter(
    (measurement) => berlinDay(measurement.time) <= lastDay,
  );
}

// A path, not a URL from `import.meta.url`: under jsdom that is no file URL.
const FIXTURE = join(
  import.meta.dirname,
  "fixtures",
  "gewicht-2026-07-bis-10.csv",
);
