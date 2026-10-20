import type { CalendarDay } from "@/measurement/calendar-day";
import { findGaps, type Gap } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { isOutlier, type Trend, trends } from "../trend";
import type { GraphWindow } from "./graph-window";

/**
 * What the graph draws of a window: the counting measurements, each marked
 * whether it is an outlier and whether it is the last counting measurement
 * of all, the latest, and the trend of each day as a line with its
 * uncertainty, in pieces broken at every gap. Both ordered by day.
 */
export interface WindowSeries {
  measurements: {
    measurement: CountingMeasurement;
    outlier: boolean;
    latest: boolean;
  }[];
  trendLine: Trend[][];
}

/**
 * The series of `graphWindow` from `counting` (ordered by day), whose
 * measurements before it still shape the trend.
 */
export function windowSeries(
  counting: CountingMeasurement[],
  graphWindow: GraphWindow,
): WindowSeries {
  const everyTrend = trends(counting);
  // `trends` holds one trend per counting measurement, in the same order.
  const measurements = counting.flatMap((measurement, i) =>
    inWindow(measurement.day, graphWindow)
      ? [
          {
            measurement,
            outlier: isOutlier(everyTrend[i]),
            latest: i === counting.length - 1,
          },
        ]
      : [],
  );
  const trendLine = breakAtGaps(
    everyTrend.filter((trend) => inWindow(trend.day, graphWindow)),
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

function inWindow(day: CalendarDay, graphWindow: GraphWindow): boolean {
  // `YYYY-MM-DD` orders as text the way the days do.
  return graphWindow.firstDay <= day && day <= graphWindow.lastDay;
}
