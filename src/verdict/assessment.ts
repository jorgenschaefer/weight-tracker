import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { type MorningDeviation, morningDeviation } from "@/trend/outlier";
import { type Pace, pace } from "@/trend/pace";
import { scatter } from "@/trend/scatter";
import { type SixWeekSeries, sixWeekSeries } from "@/trend/six-week-series";
import { trends } from "@/trend/theil-sen";
import { compareAfterGap, type GapComparison } from "./gap-comparison";
import { type TrendVerdict, trendVerdict } from "./verdict";

/**
 * Everything the page shows about the weight: exactly one status, and beside
 * it the figures of the last day with a measurement and the 6-week series.
 * Each status carries the figures that day has; without any measurement there
 * are none, and no „Gemessen“ either. Only the verdict of the trend carries
 * the deviation of the morning, where the last day with a measurement has
 * one.
 */
export type Assessment =
  | (Figures & {
      status: TrendVerdict;
      trendKg: number;
      morningDeviation: MorningDeviation | null;
    })
  | (Figures & {
      status:
        | GapComparison
        | { kind: "lastMeasurementTooOld"; days: number }
        | { kind: "noVerdictYet" };
      morningDeviation: null;
    })
  | {
      status: { kind: "noVerdictYet" };
      measuredKg: null;
      trendKg: null;
      pace: null;
      sixWeekSeries: SixWeekSeries;
      morningDeviation: null;
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
    morningDeviation: null,
  };
}

const MAX_DAYS_SINCE_LAST_MEASUREMENT = 3;

/**
 * The assessment as of the last day with a measurement: the Frühwarnung where
 * that day has a 14-day pace, otherwise the comparison after the last gap -
 * and „Noch kein Urteil“ where there is no gap, or no trend before it.
 */
function assessLastDay(
  counting: CountingMeasurement[],
  today: CalendarDay,
): Assessment {
  const everyTrend = trends(counting);
  const series = sixWeekSeries(counting, today);
  const last = counting.at(-1);
  if (last === undefined) {
    return {
      status: { kind: "noVerdictYet" },
      measuredKg: null,
      trendKg: null,
      pace: null,
      sixWeekSeries: series,
      morningDeviation: null,
    };
  }

  const trendOfLast = everyTrend.find((trend) => trend.day === last.day);
  const scatterOfLast = scatter(counting, everyTrend, last.day);
  const figures = {
    measuredKg: last.kg,
    trendKg: trendOfLast?.kg ?? null,
    pace: pace(everyTrend, last.day, scatterOfLast),
    sixWeekSeries: series,
    morningDeviation: null,
  };
  const noVerdictYet = {
    status: { kind: "noVerdictYet" },
    ...figures,
  } as const;
  const verdict = trendVerdict(everyTrend, counting);
  if (verdict === null || trendOfLast === undefined) {
    const gap = findGaps(counting).at(-1);
    const comparison =
      gap === undefined ? null : compareAfterGap(counting, everyTrend, gap);
    if (comparison === null) return noVerdictYet;
    return { status: comparison, ...figures };
  }
  return {
    ...figures,
    status: verdict,
    trendKg: trendOfLast.kg,
    morningDeviation: morningDeviation(last, trendOfLast, scatterOfLast),
  };
}
