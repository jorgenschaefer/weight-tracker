import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { fourDayPace } from "@/trend/four-day-pace";
import type { Trend } from "@/trend/trend";

/**
 * What the trend says: „Nimmt ab“, or no decrease for `days` days, or
 * „Nimmt zu“ - each of the last two with the days without a decrease.
 */
export type TrendVerdict =
  | { kind: "losing" }
  | ({ kind: "noDecrease" } & DaysWithoutDecrease)
  | ({ kind: "gaining" } & DaysWithoutDecrease);

/**
 * No decrease for `days` days `since` the last day with a falling trend -
 * „at least“, since the first counting measurement or the first after the
 * last gap, where no trend fell since - on its {@link Level}.
 */
export interface DaysWithoutDecrease {
  days: number;
  atLeast: boolean;
  since: CalendarDay;
  level: Level;
}

/** How alarming a no-decrease verdict is: 3–6, 7–13, or 14 and more days. */
export type Level = 1 | 2 | 3;

/**
 * The verdict on the day of the last of `counting` (ordered by day), from
 * `trends` up to it (ordered by day, the trend of that day among them).
 *
 * Only the days from the first counting measurement after the last gap on
 * count: the comparison after the gap has judged the days before it. The days
 * without a falling trend count from the last day whose trend fell. Where the
 * 4-day pace of the last day is over +1.0 kg per week, the verdict is
 * „Nimmt zu“; otherwise under 3 such days it stays „Nimmt ab“. Where none
 * fell, they count „at least“ from the first of those days, from the first
 * day with a trend on.
 */
export function trendVerdict(
  trends: Trend[],
  counting: CountingMeasurement[],
): TrendVerdict {
  const lastDay = lastOf(counting).day;
  const firstCounted = firstCountedDay(counting);
  const withoutDecrease = daysWithoutDecrease(trends, lastDay, firstCounted);
  const lastPace = fourDayPace(trends, lastDay, firstCounted);
  if (lastPace !== null && lastPace > GAINING_KG_PER_WEEK + ROUNDING_ERROR) {
    return { kind: "gaining", ...withoutDecrease };
  }
  if (!withoutDecrease.atLeast && withoutDecrease.days < CONFIRMATION_DAYS) {
    return { kind: "losing" };
  }
  return { kind: "noDecrease", ...withoutDecrease };
}

/** The days without a decrease up to `lastDay`, counted from `firstCounted` on. */
function daysWithoutDecrease(
  trends: Trend[],
  lastDay: CalendarDay,
  firstCounted: CalendarDay,
): DaysWithoutDecrease {
  const lastFalling = trends.findLast(
    (trend) =>
      daysBetween(firstCounted, trend.day) >= 0 &&
      isFalling(trend, trends, firstCounted),
  );
  const since = lastFalling?.day ?? firstCounted;
  const days = daysBetween(since, lastDay);
  return {
    days,
    atLeast: lastFalling === undefined,
    since,
    level: level(days),
  };
}

/**
 * Whether `trend` falls faster than 0.2 kg per week over its fortnight and,
 * where its day has one, at its 4-day pace among `trends` too.
 */
function isFalling(
  trend: Trend,
  trends: Trend[],
  firstCounted: CalendarDay,
): boolean {
  const pace = fourDayPace(trends, trend.day, firstCounted);
  return (
    trend.slopePerWeek < FALLING_KG_PER_WEEK - ROUNDING_ERROR &&
    (pace === null || pace < FALLING_KG_PER_WEEK - ROUNDING_ERROR)
  );
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
/** „Nimmt zu“ over this 4-day pace of the last day. */
const GAINING_KG_PER_WEEK = 1.0;
/** The days without a decrease before the verdict says so. */
export const CONFIRMATION_DAYS = 3;

/**
 * Far below a gram a week, far above what the arithmetic of a slope or a pace
 * loses: 0.2 kg in 7 days comes out as -0.20000000000000284, and would count
 * without it.
 */
const ROUNDING_ERROR = 1e-9;
