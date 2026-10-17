import { daysBetween } from "@/measurement/calendar-day";
import { findGaps, type Gap } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { median, type Trend } from "@/trend/trend";

/**
 * „Nach N Tagen ohne Messung: ±x kg gegenüber vorher“: the median of the
 * counting measurements after the gap against the trend on the last day
 * before it, and whether that is more than the normal variation.
 */
export interface GapComparison {
  kind: "gapComparison";
  gapDays: number;
  differenceKg: number;
  variation: "clearIncrease" | "clearDecrease" | "withinNormalVariation";
}

/**
 * The last gap among `counting` (ordered by day) while fewer than
 * {@link MEASUREMENTS_UNTIL_VERDICT} counting measurements follow it; none
 * once they do, when the verdict holds again.
 */
export function gapUnderComparison(
  counting: CountingMeasurement[],
): Gap | null {
  const gap = findGaps(counting).at(-1);
  if (gap === undefined) return null;
  const after = measurementsAfter(counting, gap);
  return after.length < MEASUREMENTS_UNTIL_VERDICT ? gap : null;
}

/**
 * The comparison after `gap`, from `counting` and their `trends` (both
 * ordered by day). The difference is clear where it is larger than
 * 2 · s / √n: s the spread of the counting measurements around their day's
 * trend in the 4 weeks up to the last day before the gap, n the number of
 * counting measurements after it. None where that last day has no trend.
 */
export function compareAfterGap(
  counting: CountingMeasurement[],
  trends: Trend[],
  gap: Gap,
): GapComparison | null {
  const trendBefore = trends.find((trend) => trend.day === gap.lastDayBefore);
  if (trendBefore === undefined) return null;
  const after = measurementsAfter(counting, gap);
  const differenceKg =
    median(after.map((measurement) => measurement.kg)) - trendBefore.kg;
  const normalVariation =
    (2 * spreadBefore(counting, trends, gap)) / Math.sqrt(after.length);
  return {
    kind: "gapComparison",
    gapDays: gap.days,
    differenceKg,
    variation: variation(differenceKg, normalVariation),
  };
}

const MEASUREMENTS_UNTIL_VERDICT = 5;
const SPREAD_DAYS = 28;

function measurementsAfter(
  counting: CountingMeasurement[],
  gap: Gap,
): CountingMeasurement[] {
  // `YYYY-MM-DD` orders as text the way the days do.
  return counting.filter((measurement) => measurement.day >= gap.firstDayAfter);
}

/**
 * The root mean square of how far the counting measurements in the 4 weeks
 * up to the last day before `gap` lie from their day's trend; a day without
 * a trend has nothing to lie from and is left out.
 */
function spreadBefore(
  counting: CountingMeasurement[],
  trends: Trend[],
  gap: Gap,
): number {
  const trendOfDay = new Map(trends.map((trend) => [trend.day, trend]));
  const squares = counting.flatMap((measurement) => {
    const daysBeforeGap = daysBetween(measurement.day, gap.lastDayBefore);
    const trend = trendOfDay.get(measurement.day);
    if (daysBeforeGap < 0 || daysBeforeGap >= SPREAD_DAYS || !trend) return [];
    return [(measurement.kg - trend.kg) ** 2];
  });
  return Math.sqrt(
    squares.reduce((sum, square) => sum + square, 0) / squares.length,
  );
}

function variation(
  differenceKg: number,
  normalVariation: number,
): GapComparison["variation"] {
  if (differenceKg > normalVariation) return "clearIncrease";
  if (differenceKg < -normalVariation) return "clearDecrease";
  return "withinNormalVariation";
}
