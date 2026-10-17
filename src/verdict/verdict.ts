import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { Trend } from "@/trend/trend";

/**
 * What the trend says: „Nimmt ab“, or no decrease for `days` days `since` the
 * last day with a falling trend - „at least“, since the first day with a
 * trend, where no trend in the history fell - on its {@link Level}.
 */
export type TrendVerdict =
  | { kind: "losing" }
  | {
      kind: "noDecrease";
      days: number;
      atLeast: boolean;
      since: CalendarDay;
      level: Level;
    };

/** How alarming a no-decrease verdict is: 3–6, 7–13, or 14 and more days. */
export type Level = 1 | 2 | 3;

/**
 * The verdict on `lastDay`, the day of the last counting measurement, from
 * `trends` up to it (ordered by day, the trend of `lastDay` among them).
 *
 * The days without a falling trend count from the last day whose trend fell,
 * or, where none did, from the first day with a trend. Under 3 such days the
 * verdict stays „Nimmt ab“.
 */
export function trendVerdict(
  trends: Trend[],
  lastDay: CalendarDay,
): TrendVerdict {
  const lastFalling = trends.findLast(isFalling);
  const since = lastFalling ?? trends[0];
  const days = daysBetween(since.day, lastDay);
  if (days < CONFIRMATION_DAYS) return { kind: "losing" };
  return {
    kind: "noDecrease",
    days,
    atLeast: lastFalling === undefined,
    since: since.day,
    level: level(days),
  };
}

/** Whether the trend falls faster than 0.2 kg per week over its fortnight. */
function isFalling(trend: Trend): boolean {
  return trend.slopePerWeek < FALLING_KG_PER_WEEK - ROUNDING_ERROR;
}

function level(days: number): Level {
  if (days < 7) return 1;
  if (days < 14) return 2;
  return 3;
}

const FALLING_KG_PER_WEEK = -0.2;
const CONFIRMATION_DAYS = 3;

/**
 * Far below a gram a week, far above what the slope's arithmetic loses: 0.2 kg
 * in 7 days comes out as -0.20000000000000284, and would count without it.
 */
const ROUNDING_ERROR = 1e-9;
