import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import type { Trend } from "@/trend/trend";

/**
 * What the trend says: „Nimmt ab“, or no decrease for `days` days `since` the
 * last day with a falling trend - „at least“, since the first counting
 * measurement or the first after the last gap, where no trend fell since -
 * on its {@link Level}.
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
 * The verdict on the day of the last of `counting` (ordered by day), from
 * `trends` up to it (ordered by day, the trend of that day among them).
 *
 * Only the days from the first counting measurement after the last gap on
 * count: the comparison after the gap has judged the days before it. The days
 * without a falling trend count from the last day whose trend fell; under 3
 * such days the verdict stays „Nimmt ab“. Where none fell, they count „at
 * least“ from the first of those days, from the first day with a trend on.
 */
export function trendVerdict(
  trends: Trend[],
  counting: CountingMeasurement[],
): TrendVerdict {
  const lastDay = lastOf(counting).day;
  const firstCounted = firstCountedDay(counting);
  const lastFalling = trends.findLast(
    (trend) => daysBetween(firstCounted, trend.day) >= 0 && isFalling(trend),
  );
  if (lastFalling === undefined) {
    const days = daysBetween(firstCounted, lastDay);
    return {
      kind: "noDecrease",
      days,
      atLeast: true,
      since: firstCounted,
      level: level(days),
    };
  }
  const days = daysBetween(lastFalling.day, lastDay);
  if (days < CONFIRMATION_DAYS) return { kind: "losing" };
  return {
    kind: "noDecrease",
    days,
    atLeast: false,
    since: lastFalling.day,
    level: level(days),
  };
}

/** Whether the trend falls faster than 0.2 kg per week over its fortnight. */
function isFalling(trend: Trend): boolean {
  return trend.slopePerWeek < FALLING_KG_PER_WEEK - ROUNDING_ERROR;
}

function lastOf(counting: CountingMeasurement[]): CountingMeasurement {
  const last = counting.at(-1);
  if (last === undefined) {
    throw new Error("trendVerdict needs at least one counting measurement");
  }
  return last;
}

/** The first counting measurement's day, or after a gap the first after the last one. */
function firstCountedDay(counting: CountingMeasurement[]): CalendarDay {
  return findGaps(counting).at(-1)?.firstDayAfter ?? counting[0].day;
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
