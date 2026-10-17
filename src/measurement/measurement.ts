import { berlinDay, type CalendarDay } from "./calendar-day";

/** One weight value from Google Health: when it was taken, and the weight. */
export interface Measurement {
  time: Date;
  kg: number;
}

/**
 * The first measurement of a calendar day in Europe/Berlin, the only one
 * trend, pace and verdict use; with the day it counts for.
 */
export interface CountingMeasurement extends Measurement {
  day: CalendarDay;
}

/**
 * The counting measurements among `measurements`, in any order: the first of
 * each Berlin calendar day, ordered by day.
 */
export function countingMeasurements(
  measurements: Measurement[],
): CountingMeasurement[] {
  const counting: CountingMeasurement[] = [];
  for (const measurement of measurements.toSorted(byTime)) {
    const day = berlinDay(measurement.time);
    if (counting.at(-1)?.day !== day) counting.push({ ...measurement, day });
  }
  return counting;
}

/** Orders measurements from the earliest to the latest. */
export function byTime(a: Measurement, b: Measurement): number {
  return a.time.getTime() - b.time.getTime();
}
