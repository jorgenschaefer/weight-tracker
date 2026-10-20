import type { CalendarDay } from "@/measurement/calendar-day";
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

/**
 * „Heute · X kg über/unter dem Trend“: the counting measurement of a day
 * that is an outlier, and how far it lies from its day's trend, in kg -
 * negative below it.
 */
export interface MorningDeviation {
  day: CalendarDay;
  differenceKg: number;
}

/**
 * The deviation of `measurement` from `trend`, the trend of its day, on its
 * day's scatter of `scatterKg`; none where it is no {@link isOutlier outlier}.
 */
export function morningDeviation(
  measurement: CountingMeasurement,
  trend: Trend,
  scatterKg: number,
): MorningDeviation | null {
  if (!isOutlier(measurement, trend, scatterKg)) return null;
  return { day: measurement.day, differenceKg: measurement.kg - trend.kg };
}
