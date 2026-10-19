import { parseStoredMeasurement, toStoredMeasurement } from "./cache";
import { parseJson } from "./json";
import type { Measurement } from "./measurement";

/**
 * The `localStorage` key of the entered measurements. The format's version is
 * part of the key, so an entry of another version is never read as this one.
 */
export const ENTERED_KEY = "gewicht:eingetragen:v1";

/**
 * The weight in kg that `input`, typed into „Gewicht heute“, enters: 30 to
 * 250 kg with at most one decimal, after a comma or a point. `null` for
 * anything else, an empty field too.
 */
export function parseEnteredKg(input: string): number | null {
  const match = /^(\d+)(?:[.,](\d))?$/.exec(input.trim());
  if (match === null) return null;
  const kg = Number(`${match[1]}.${match[2] ?? "0"}`);
  return kg >= MIN_KG && kg <= MAX_KG ? kg : null;
}

const MIN_KG = 30;
const MAX_KG = 250;

/**
 * The entered measurements left after a fetch of `fetched` that started at
 * `startedAt`: those it does not hold, and that were entered less than an
 * hour before it started. A fetch holds an entered measurement where it has
 * one of the same weight to 0.1 kg, taken at most a minute before or after
 * it. One that a fetch an hour later still does not hold, Google has not
 * kept - it was deleted in the Google app, say.
 */
export function enteredAfterFetch(
  entered: Measurement[],
  fetched: Measurement[],
  startedAt: Date,
): Measurement[] {
  return entered.filter(
    (e) =>
      !fetched.some((f) => isSameWeighing(e, f)) &&
      startedAt.getTime() - e.time.getTime() < GOOGLE_HOLDS_IT_WITHIN_MS,
  );
}

/** The stored form of `entered`, as kept under {@link ENTERED_KEY}. */
export function serializeEnteredMeasurements(entered: Measurement[]): string {
  return JSON.stringify(entered.map(toStoredMeasurement));
}

/**
 * The entered measurements stored as `stored`; none where the entry is
 * missing, is not the stored form of a list of measurements, or holds a
 * time that is not one.
 */
export function parseEnteredMeasurements(stored: string | null): Measurement[] {
  if (stored === null) return [];
  const entry = parseJson(stored);
  if (!Array.isArray(entry)) return [];
  const measurements = entry.map(parseStoredMeasurement);
  return measurements.every((m) => m !== null) ? measurements : [];
}

function isSameWeighing(entered: Measurement, fetched: Measurement): boolean {
  return (
    tenthsOfKg(entered.kg) === tenthsOfKg(fetched.kg) &&
    Math.abs(entered.time.getTime() - fetched.time.getTime()) <=
      SAME_WEIGHING_WITHIN_MS
  );
}

function tenthsOfKg(kg: number): number {
  return Math.round(kg * 10);
}

const SAME_WEIGHING_WITHIN_MS = 60_000;
const GOOGLE_HOLDS_IT_WITHIN_MS = 60 * 60_000;
