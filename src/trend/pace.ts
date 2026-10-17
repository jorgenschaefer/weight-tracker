import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { Trend } from "./trend";

/** The change of the trend over 4 weeks in kg per week, and its band. */
export interface Pace {
  kgPerWeek: number;
  band: PaceBand;
}

/** The five bands of the pace, with the band the page names for each. */
export type PaceBand =
  /** „Zunahme“: over +0.1 kg per week. */
  | "gain"
  /** „Gewicht gehalten“: from −0.1 to +0.1 kg per week. */
  | "maintained"
  /** „Langsames Abnehmen“: under −0.1 down to −0.5 kg per week. */
  | "slowLoss"
  /** „Moderates Abnehmen“: under −0.5 down to −1.0 kg per week. */
  | "moderateLoss"
  /** „Schnelles Abnehmen“: under −1.0 kg per week. */
  | "fastLoss";

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

/** The band of a pace of `kgPerWeek`; a boundary belongs to the band nearer 0. */
export function paceBand(kgPerWeek: number): PaceBand {
  if (kgPerWeek > 0.1) return "gain";
  if (kgPerWeek >= -0.1) return "maintained";
  if (kgPerWeek >= -0.5) return "slowLoss";
  if (kgPerWeek >= -1.0) return "moderateLoss";
  return "fastLoss";
}

const PACE_DAYS = 28;

/** `kg` rounded to hundredths, a half up; never -0. */
function toHundredths(kg: number): number {
  return Math.round(kg * 100) / 100 + 0;
}
