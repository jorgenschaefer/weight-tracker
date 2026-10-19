import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { sortAgainstThreshold, threshold } from "./scatter";
import type { Trend } from "./trend";

/** The change of the trend over 4 weeks in kg per week, and its band. */
export interface Pace {
  kgPerWeek: number;
  band: PaceBand;
}

/**
 * The three bands of the pace, with the name „Langfristig“ gives each, against
 * the threshold of the 28-day pace on the scatter of its day.
 */
export type PaceBand =
  /** „Nimmt zu“: over the threshold. */
  | "gain"
  /** „Stagniert“: from minus the threshold to the threshold. */
  | "stagnation"
  /** „Nimmt ab“: under minus the threshold. */
  | "loss";

/**
 * The pace on `day`: from the latest trend at least 28 days before it to the
 * trend of `day`, per week between them, in hundredths of a kg - the
 * precision the page shows, so the band always fits the number shown -, in
 * its band on `scatterKg`, the scatter of `day`. None where `day` has no
 * trend or none lies far enough back.
 */
export function pace(
  trends: Trend[],
  day: CalendarDay,
  scatterKg: number,
): Pace | null {
  const now = trends.find((trend) => trend.day === day);
  const before = trends.findLast(
    (trend) => daysBetween(trend.day, day) >= PACE_DAYS,
  );
  if (now === undefined || before === undefined) return null;
  const weeks = daysBetween(before.day, now.day) / 7;
  const kgPerWeek = toHundredths((now.kg - before.kg) / weeks);
  return { kgPerWeek, band: paceBand(kgPerWeek, scatterKg) };
}

/**
 * The band of a pace of `kgPerWeek` on a day of `scatterKg`, against the
 * threshold of the 28-day pace; a pace on it belongs to „stagniert“.
 */
export function paceBand(kgPerWeek: number, scatterKg: number): PaceBand {
  const limit = threshold("pace", scatterKg);
  switch (sortAgainstThreshold(kgPerWeek, limit)) {
    case "above":
      return "gain";
    case "between":
      return "stagnation";
    case "below":
      return "loss";
  }
}

/**
 * The calories a day a pace of `kgPerWeek` stands for, a deficit or a
 * surplus by its sign: its amount × {@link KCAL_PER_KG} / 7, rounded down to
 * tens.
 */
export function kcalPerDay(kgPerWeek: number): number {
  // In whole hundredths, the pace's precision, the product is exact: in kg,
  // 4.1 × 7700 / 7 is 4509.999999999999 and would round down to 4500.
  const hundredths = Math.round(Math.abs(kgPerWeek) * 100);
  const kcal = (hundredths * KCAL_PER_KG) / 7 / 100;
  return Math.floor(kcal / 10) * 10;
}

/** The energy in a kg of body weight. */
const KCAL_PER_KG = 7700;

const PACE_DAYS = 28;

/** `kg` rounded to hundredths, a half up; never -0. */
function toHundredths(kg: number): number {
  return Math.round(kg * 100) / 100 + 0;
}
