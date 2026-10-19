import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { Trend } from "./trend";

/**
 * The 7-day pace on `day`: its trend against the trend of the last day 7 to
 * 10 days before it, in kg per week (negative while it falls). Compared only
 * with trends from `firstComparable` on, the first day after the last gap.
 * None where `day` has no trend or no such day has one.
 */
export function weekPace(
  trends: Trend[],
  day: CalendarDay,
  firstComparable: CalendarDay,
): number | null {
  return paceAgainstDaysBack(trends, day, firstComparable, 7);
}

/**
 * The 14-day pace on `day`: its trend against the trend of the last day 14
 * to 17 days before it, in kg per week, compared as {@link weekPace} does.
 */
export function fortnightPace(
  trends: Trend[],
  day: CalendarDay,
  firstComparable: CalendarDay,
): number | null {
  return paceAgainstDaysBack(trends, day, firstComparable, 14);
}

/**
 * The pace on `day` against the trend of the last day `minDaysBack` to
 * {@link WINDOW_DAYS} more days before it, from `firstComparable` on, in kg
 * per week.
 */
function paceAgainstDaysBack(
  trends: Trend[],
  day: CalendarDay,
  firstComparable: CalendarDay,
  minDaysBack: number,
): number | null {
  const now = trends.find((trend) => trend.day === day);
  const before = trends.findLast(
    (trend) =>
      daysBetween(trend.day, day) >= minDaysBack &&
      daysBetween(firstComparable, trend.day) >= 0,
  );
  if (now === undefined || before === undefined) return null;
  const days = daysBetween(before.day, day);
  if (days > minDaysBack + WINDOW_DAYS) return null;
  return ((now.kg - before.kg) / days) * 7;
}

const WINDOW_DAYS = 3;
