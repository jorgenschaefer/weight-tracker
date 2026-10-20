import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps, type Gap } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { isOutlier, type Trend, trends } from "./trend";

/**
 * What the graph draws of the last 6 weeks: the counting measurements, each
 * marked whether it is an outlier, and the trend of each day as a line with
 * its uncertainty, in pieces broken at every gap. Both ordered by day.
 */
export interface SixWeekSeries {
  measurements: { measurement: CountingMeasurement; outlier: boolean }[];
  trendLine: Trend[][];
}

/**
 * The series of `today` and the 41 days before it, from `counting` (ordered
 * by day), whose earlier measurements still shape the trend.
 */
export function sixWeekSeries(
  counting: CountingMeasurement[],
  today: CalendarDay,
): SixWeekSeries {
  const everyTrend = trends(counting);
  // `trends` holds one trend per counting measurement, in the same order.
  const measurements = counting.flatMap((measurement, i) =>
    inSixWeeks(measurement.day, today)
      ? [{ measurement, outlier: isOutlier(everyTrend[i]) }]
      : [],
  );
  const trendLine = breakAtGaps(
    everyTrend.filter((trend) => inSixWeeks(trend.day, today)),
    findGaps(counting),
  );
  return { measurements, trendLine };
}

/** `line` in pieces, a new one after every gap that lies within it. */
function breakAtGaps(line: Trend[], gaps: Gap[]): Trend[][] {
  const pieces: Trend[][] = [];
  for (const [i, trend] of line.entries()) {
    const previous = line[i - 1];
    if (previous === undefined || gapBetween(previous, trend, gaps)) {
      pieces.push([trend]);
    } else {
      pieces[pieces.length - 1].push(trend);
    }
  }
  return pieces;
}

function gapBetween(earlier: Trend, later: Trend, gaps: Gap[]): boolean {
  // `YYYY-MM-DD` orders as text the way the days do.
  return gaps.some(
    (gap) => earlier.day <= gap.lastDayBefore && gap.firstDayAfter <= later.day,
  );
}

function inSixWeeks(day: CalendarDay, today: CalendarDay): boolean {
  const daysAgo = daysBetween(day, today);
  return daysAgo >= 0 && daysAgo < SIX_WEEKS_DAYS;
}

const SIX_WEEKS_DAYS = 42;
