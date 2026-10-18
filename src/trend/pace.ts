import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { Trend } from "./trend";

/** The change of the trend over 4 weeks in kg per week, and its band. */
export interface Pace {
  kgPerWeek: number;
  band: PaceBand;
}

/** The three bands of the pace, with the band the page names for each. */
export type PaceBand =
  /** „4 Wochen: nimmt zu“: over +0.2 kg per week. */
  | "gain"
  /** „4 Wochen: stagniert“: from −0.2 to +0.2 kg per week. */
  | "stagnation"
  /** „4 Wochen: nimmt ab“: under −0.2 kg per week. */
  | "loss";

/**
 * The pace on `day`: from the latest trend at least 28 days before it to the
 * trend of `day`, per week between them, in hundredths of a kg - the
 * precision the page shows, so the band always fits the number shown. None
 * where `day` has no trend or none lies far enough back.
 */
export function pace(trends: Trend[], day: CalendarDay): Pace | null {
  const now = trends.find((trend) => trend.day === day);
  const before = trends.findLast(
    (trend) => daysBetween(trend.day, day) >= PACE_DAYS,
  );
  if (now === undefined || before === undefined) return null;
  const weeks = daysBetween(before.day, now.day) / 7;
  const kgPerWeek = toHundredths((now.kg - before.kg) / weeks);
  return { kgPerWeek, band: paceBand(kgPerWeek) };
}

/** The band of a pace of `kgPerWeek`; a boundary belongs to „stagniert“. */
export function paceBand(kgPerWeek: number): PaceBand {
  if (kgPerWeek > 0.2) return "gain";
  if (kgPerWeek >= -0.2) return "stagnation";
  return "loss";
}

const PACE_DAYS = 28;

/** `kg` rounded to hundredths, a half up; never -0. */
function toHundredths(kg: number): number {
  return Math.round(kg * 100) / 100 + 0;
}
