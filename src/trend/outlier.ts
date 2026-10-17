import type { CountingMeasurement } from "@/measurement/measurement";
import type { Trend } from "./trend";

/**
 * Whether `measurement` lies more than 0.9 kg from `trend`, the trend of its
 * day.
 */
export function isOutlier(
  measurement: CountingMeasurement,
  trend: Trend,
): boolean {
  return Math.abs(measurement.kg - trend.kg) > OUTLIER_KG + ROUNDING_ERROR;
}

const OUTLIER_KG = 0.9;

/**
 * Far below a gram, far above what subtracting two weights loses: in kg,
 * 96.8 lies 0.9000000000000057 from 97.7, and would count without it.
 */
const ROUNDING_ERROR = 1e-9;
