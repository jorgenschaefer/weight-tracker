import type { CountingMeasurement } from "@/measurement/measurement";
import { sortAgainstThreshold, threshold } from "./scatter";
import type { Trend } from "./theil-sen";

/**
 * Whether `measurement` lies beyond the morning's threshold from `trend`,
 * the trend of its day, on its day's scatter of `scatterKg` - above it or
 * below it.
 */
export function isOutlier(
  measurement: CountingMeasurement,
  trend: Trend,
  scatterKg: number,
): boolean {
  return (
    sortAgainstThreshold(
      measurement.kg - trend.kg,
      threshold("morning", scatterKg),
    ) !== "between"
  );
}
