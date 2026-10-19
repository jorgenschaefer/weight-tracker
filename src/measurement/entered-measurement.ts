import type { Measurement } from "./measurement";

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
 * The entered measurements that `fetched`, the measurements of a fetch, does
 * not hold yet. A fetch holds an entered measurement where it has one of the
 * same weight to 0.1 kg, taken at most a minute before or after it.
 */
export function notYetFetched(
  entered: Measurement[],
  fetched: Measurement[],
): Measurement[] {
  return entered.filter((e) => !fetched.some((f) => isSameWeighing(e, f)));
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
