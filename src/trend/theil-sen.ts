import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";

/** The smoothed weight on a day with a counting measurement. */
export interface Trend {
  day: CalendarDay;
  kg: number;
}

/**
 * The trend of each day among `counting` (ordered by day) that has at least
 * {@link MIN_MEASUREMENTS} counting measurements in the fortnight up to it,
 * the day and the 13 before it. The slope is the median of the slopes between every two
 * of them (Theil-Sen), the trend the median of them projected along it to the
 * day - so one day far off moves neither.
 */
export function trends(counting: CountingMeasurement[]): Trend[] {
  return counting.flatMap((measurement, i) => {
    const fortnight = counting
      .slice(0, i + 1)
      .filter(
        (earlier) => daysBetween(earlier.day, measurement.day) < FORTNIGHT_DAYS,
      );
    if (fortnight.length < MIN_MEASUREMENTS) return [];
    const slopePerDay = median(pairwiseSlopes(fortnight));
    const kg = median(
      fortnight.map(
        (earlier) =>
          earlier.kg + slopePerDay * daysBetween(earlier.day, measurement.day),
      ),
    );
    return [{ day: measurement.day, kg }];
  });
}

const FORTNIGHT_DAYS = 14;
const MIN_MEASUREMENTS = 5;

function pairwiseSlopes(fortnight: CountingMeasurement[]): number[] {
  return fortnight.flatMap((a, i) =>
    fortnight
      .slice(i + 1)
      .map((b) => (b.kg - a.kg) / daysBetween(a.day, b.day)),
  );
}

export function median(values: number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
