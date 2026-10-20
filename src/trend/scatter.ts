import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import type { Trend } from "./theil-sen";

/**
 * The scatter of `day`: the root mean square of how far the counting
 * measurements among `counting` lie from their day's trend among `trends`,
 * over the days with a trend in the {@link SCATTER_DAYS} days before `day`,
 * `day` itself not among them. With fewer than {@link MIN_DISTANCES} such
 * distances, it is {@link START_SCATTER_KG}.
 */
export function scatter(
  counting: CountingMeasurement[],
  trends: Trend[],
  day: CalendarDay,
): number {
  const trendOfDay = new Map(trends.map((trend) => [trend.day, trend]));
  const squares = counting.flatMap((measurement) => {
    const daysBefore = daysBetween(measurement.day, day);
    const trend = trendOfDay.get(measurement.day);
    if (daysBefore < 1 || daysBefore > SCATTER_DAYS || !trend) return [];
    return [(measurement.kg - trend.kg) ** 2];
  });
  if (squares.length < MIN_DISTANCES) return START_SCATTER_KG;
  return Math.sqrt(
    squares.reduce((sum, square) => sum + square, 0) / squares.length,
  );
}

const SCATTER_DAYS = 28;
const MIN_DISTANCES = 10;
/** The scatter of the user's measurements in 2026. */
const START_SCATTER_KG = 0.7;

/**
 * The threshold of the morning's distance from its trend, in kg, on a day of
 * `scatterKg`: {@link THRESHOLD_FACTOR} times what noise alone makes of it.
 */
export function threshold(scatterKg: number): number {
  return THRESHOLD_FACTOR * NOISE_FACTOR * scatterKg;
}

/** How far a value beyond what noise alone makes of it goes before it counts. */
const THRESHOLD_FACTOR = 1.25;

/**
 * How much the morning's distance varies on noise alone, per kg of scatter:
 * its mean in a simulation of a steady weight with a random daily scatter of
 * 1 kg, the trend computed as on the graph; 0.92, rounded up.
 */
const NOISE_FACTOR = 1.0;

/**
 * Where `value` lies against `limit`: above it, below its negative, or
 * between the two - on either one counts as between.
 */
export function sortAgainstThreshold(
  value: number,
  limit: number,
): "below" | "between" | "above" {
  if (value > limit + ROUNDING_ERROR) return "above";
  if (value < -limit - ROUNDING_ERROR) return "below";
  return "between";
}

/**
 * Far below a gram, far above what subtracting two weights loses: in kg,
 * 96.8 lies 0.9000000000000057 from 97.7, and would lie beyond 0.9 without it.
 */
const ROUNDING_ERROR = 1e-9;
