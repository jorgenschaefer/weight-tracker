import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { Trend } from "./trend";

/**
 * The 4-day pace on `day`: its trend against the trend of the last day 4 to
 * 7 days before it, in kg per week (negative while it falls). Compared only
 * with trends from `firstComparable` on, the first day after the last gap.
 * None where `day` has no trend or no such day has one.
 */
export function fourDayPace(
  trends: Trend[],
  day: CalendarDay,
  firstComparable: CalendarDay,
): number | null {
  const now = trends.find((trend) => trend.day === day);
  const before = trends.findLast(
    (trend) =>
      daysBetween(trend.day, day) >= MIN_DAYS_BACK &&
      daysBetween(firstComparable, trend.day) >= 0,
  );
  if (now === undefined || before === undefined) return null;
  const days = daysBetween(before.day, day);
  if (days > MAX_DAYS_BACK) return null;
  return ((now.kg - before.kg) / days) * 7;
}

const MIN_DAYS_BACK = 4;
const MAX_DAYS_BACK = 7;
