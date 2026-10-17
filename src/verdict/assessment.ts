import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import { type Pace, pace } from "@/trend/pace";
import { type SixWeekSeries, sixWeekSeries } from "@/trend/six-week-series";
import { trends } from "@/trend/trend";
import {
  compareAfterGap,
  type GapComparison,
  gapUnderComparison,
} from "./gap-comparison";
import { type TrendVerdict, trendVerdict } from "./verdict";

/**
 * Everything the page shows about the weight: exactly one status, and beside
 * it the figures of the last day with a measurement and the 6-week series.
 * Each status carries the figures it can have: under „Noch kein Urteil“
 * there is no trend - no trend, no pace and no trend line - and without any
 * measurement no „Gemessen“ either.
 */
export type Assessment =
  | (Figures & { status: TrendVerdict; trendKg: number })
  | (Figures & {
      status: GapComparison | { kind: "lastMeasurementTooOld"; days: number };
    })
  | {
      status: { kind: "noVerdictYet" };
      measuredKg: number | null;
      trendKg: null;
      pace: null;
      sixWeekSeries: SixWeekSeries;
    };

/** What the page says above the figures: a verdict, or why there is none. */
export type AssessmentStatus = Assessment["status"];

interface Figures {
  /** „Gemessen“: the counting measurement of the last day with a measurement. */
  measuredKg: number;
  /** The trend of that day; none where it has none. */
  trendKg: number | null;
  /** The 4-week pace of that day; none where it has none. */
  pace: Pace | null;
  sixWeekSeries: SixWeekSeries;
}

/**
 * The assessment on `today` from `counting` (ordered by day).
 *
 * The last measurement more than 3 days before `today` replaces any verdict,
 * and wins over „Noch kein Urteil“ too; the figures stay.
 */
export function assess(
  counting: CountingMeasurement[],
  today: CalendarDay,
): Assessment {
  const assessment = assessLastDay(counting, today);
  const last = counting.at(-1);
  if (last === undefined) return assessment;
  const days = daysBetween(last.day, today);
  if (days <= MAX_DAYS_SINCE_LAST_MEASUREMENT) return assessment;
  return {
    status: { kind: "lastMeasurementTooOld", days },
    measuredKg: last.kg,
    trendKg: assessment.trendKg,
    pace: assessment.pace,
    sixWeekSeries: assessment.sixWeekSeries,
  };
}

const MAX_DAYS_SINCE_LAST_MEASUREMENT = 3;

/**
 * The assessment as of the last day with a measurement: the comparison while
 * a gap is under comparison, otherwise the verdict of the trend - and
 * „Noch kein Urteil“ where either lacks the trend it needs.
 */
function assessLastDay(
  counting: CountingMeasurement[],
  today: CalendarDay,
): Assessment {
  const everyTrend = trends(counting);
  const series = sixWeekSeries(counting, today);
  const last = counting.at(-1);
  if (last === undefined) return noVerdictYet(null, series);

  const trendOfLast = everyTrend.find((trend) => trend.day === last.day);
  const figures = {
    measuredKg: last.kg,
    pace: pace(everyTrend, last.day),
    sixWeekSeries: series,
  };
  const gap = gapUnderComparison(counting);
  if (gap !== null) {
    const comparison = compareAfterGap(counting, everyTrend, gap);
    if (comparison === null) return noVerdictYet(last.kg, series);
    return { status: comparison, trendKg: trendOfLast?.kg ?? null, ...figures };
  }
  if (trendOfLast === undefined) return noVerdictYet(last.kg, series);
  return {
    status: trendVerdict(everyTrend, last.day),
    trendKg: trendOfLast.kg,
    ...figures,
  };
}

/** „Noch kein Urteil“: only „Gemessen“, and the graph only the points, none marked an outlier. */
function noVerdictYet(
  measuredKg: number | null,
  series: SixWeekSeries,
): Assessment {
  return {
    status: { kind: "noVerdictYet" },
    measuredKg,
    trendKg: null,
    pace: null,
    sixWeekSeries: {
      measurements: series.measurements.map(({ measurement }) => ({
        measurement,
        outlier: false,
      })),
      trendLine: [],
    },
  };
}
