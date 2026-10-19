import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps, type Gap } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { isOutlier } from "./outlier";
import { scatter } from "./scatter";
import { type Trend, trends } from "./trend";

/**
 * What the graph draws of the last 6 weeks: the counting measurements, each
 * marked whether it is an outlier on the scatter of its own day, and the
 * trend of each day as a line, in pieces broken at every gap. Both ordered
 * by day.
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
  const trendOfDay = new Map(everyTrend.map((trend) => [trend.day, trend]));
  const measurements = counting
    .filter((measurement) => inSixWeeks(measurement.day, today))
    .map((measurement) => {
      const trend = trendOfDay.get(measurement.day);
      return {
        measurement,
        outlier:
          trend !== undefined &&
          isOutlier(
            measurement,
            trend,
            scatter(counting, everyTrend, measurement.day),
          ),
      };
    });
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
