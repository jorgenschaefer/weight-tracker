import type { Gap } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { scatter, sortAgainstThreshold } from "@/trend/scatter";
import { median, type Trend } from "@/trend/theil-sen";

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
 * The comparison after `gap`, from `counting` and their `trends` (both
 * ordered by day). The difference is clear where it is larger than
 * 2 · s / √n: s the scatter of the first day after the gap, n the number of
 * counting measurements after it. None where the last day before the gap
 * has no trend.
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
    (2 * scatter(counting, trends, gap.firstDayAfter)) /
    Math.sqrt(after.length);
  return {
    kind: "gapComparison",
    gapDays: gap.days,
    differenceKg,
    variation: variation(differenceKg, normalVariation),
  };
}

function measurementsAfter(
  counting: CountingMeasurement[],
  gap: Gap,
): CountingMeasurement[] {
  // `YYYY-MM-DD` orders as text the way the days do.
  return counting.filter((measurement) => measurement.day >= gap.firstDayAfter);
}

function variation(
  differenceKg: number,
  normalVariation: number,
): GapComparison["variation"] {
  switch (sortAgainstThreshold(differenceKg, normalVariation)) {
    case "above":
      return "clearIncrease";
    case "below":
      return "clearDecrease";
    case "between":
      return "withinNormalVariation";
  }
}
