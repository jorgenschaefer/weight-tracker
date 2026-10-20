import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";

/**
 * What the filter estimates on a day with a counting measurement: the weight
 * and the pace, each with its variance, and how far that day's measurement
 * lay from what the filter expected.
 */
export interface Trend {
  day: CalendarDay;
  kg: number;
  /** In kg². */
  kgVariance: number;
  /** In kg per week. */
  pace: number;
  /** In (kg per week)². */
  paceVariance: number;
  /**
   * The measurement minus the weight the filter expected for its day, in
   * standard deviations of that expectation; 0 on the first day.
   */
  z: number;
}

/**
 * The trend of each day among `counting` (ordered by day), from the
 * measurements up to it: a Kalman filter of weight and pace, stepping from
 * one day with a measurement to the next.
 */
export function trends(counting: CountingMeasurement[]): Trend[] {
  if (counting.length === 0) return [];
  let state = initialState(counting[0].kg);
  const result = [toTrend(counting[0].day, state, 0)];
  for (let i = 1; i < counting.length; i++) {
    const days = daysBetween(counting[i - 1].day, counting[i].day);
    const { updated, z } = update(predict(state, days), counting[i].kg);
    state = updated;
    result.push(toTrend(counting[i].day, state, z));
  }
  return result;
}

// The filter's settings. `analysis/kalman/kalman.py` uses the same values, and
// the two change together.
/** How far a measurement scatters around the weight, in kg². */
const MEASUREMENT_VARIANCE = 0.3;
/** How far the weight itself wanders, in kg² per day. */
const KG_VARIANCE_PER_DAY = 0.02;
/** How fast the pace may change, in (kg per day)² per day. */
const PACE_VARIANCE_PER_DAY = 1e-4;
/**
 * A measurement more than this many standard deviations from what the filter
 * expected counts less: its variance grows with the square of how far beyond.
 */
const ROBUST_LIMIT_SD = 2;
/** The variance of the first measurement as the first weight, in kg². */
const INITIAL_KG_VARIANCE = 1;
/** The standard deviation of the first pace of 0, in kg per week. */
const INITIAL_PACE_SD_PER_WEEK = 0.5;

const DAYS_PER_WEEK = 7;

/**
 * Weight in kg and pace in kg per day, with their covariance: `kgKg` the
 * variance of the weight, `pacePace` that of the pace, `kgPace` between them.
 */
interface State {
  kg: number;
  pacePerDay: number;
  kgKg: number;
  kgPace: number;
  pacePace: number;
}

function initialState(kg: number): State {
  return {
    kg,
    pacePerDay: 0,
    kgKg: INITIAL_KG_VARIANCE,
    kgPace: 0,
    pacePace: (INITIAL_PACE_SD_PER_WEEK / DAYS_PER_WEEK) ** 2,
  };
}

/** `state` carried `t` days on along its pace, growing more uncertain. */
function predict(state: State, t: number): State {
  const { kgKg, kgPace, pacePace } = state;
  return {
    kg: state.kg + t * state.pacePerDay,
    pacePerDay: state.pacePerDay,
    kgKg:
      kgKg +
      2 * t * kgPace +
      t * t * pacePace +
      KG_VARIANCE_PER_DAY * t +
      (PACE_VARIANCE_PER_DAY * t ** 3) / 3,
    kgPace: kgPace + t * pacePace + (PACE_VARIANCE_PER_DAY * t * t) / 2,
    pacePace: pacePace + PACE_VARIANCE_PER_DAY * t,
  };
}

/**
 * `predicted` corrected by the measurement `kg` of its day, which counts the
 * less the further beyond {@link ROBUST_LIMIT_SD} it lies.
 */
function update(predicted: State, kg: number): { updated: State; z: number } {
  const { kgKg, kgPace, pacePace } = predicted;
  const deviation = kg - predicted.kg;
  const z = deviation / Math.sqrt(kgKg + MEASUREMENT_VARIANCE);
  const variance =
    Math.abs(z) > ROBUST_LIMIT_SD
      ? kgKg + MEASUREMENT_VARIANCE * (Math.abs(z) / ROBUST_LIMIT_SD) ** 2
      : kgKg + MEASUREMENT_VARIANCE;
  const kgGain = kgKg / variance;
  const paceGain = kgPace / variance;
  return {
    updated: {
      kg: predicted.kg + kgGain * deviation,
      pacePerDay: predicted.pacePerDay + paceGain * deviation,
      kgKg: (1 - kgGain) * kgKg,
      kgPace: (1 - kgGain) * kgPace,
      pacePace: pacePace - paceGain * kgPace,
    },
    z,
  };
}

function toTrend(day: CalendarDay, state: State, z: number): Trend {
  return {
    day,
    kg: state.kg,
    kgVariance: state.kgKg,
    pace: state.pacePerDay * DAYS_PER_WEEK,
    paceVariance: state.pacePace * DAYS_PER_WEEK ** 2,
    z,
  };
}
