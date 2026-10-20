import {
  berlinDay,
  type CalendarDay,
  daysBetween,
} from "@/measurement/calendar-day";
import type {
  CountingMeasurement,
  Measurement,
} from "@/measurement/measurement";
import { type Trend, trends } from "@/trend/trend";
import { type MorningSentence, morningSentence } from "./morning-sentence";
import {
  lossCertainty,
  type TrafficLight,
  trafficLight,
} from "./traffic-light";

/**
 * Everything the page shows about the weight above the graph: exactly one
 * status, and beside it the figures of the last day with a measurement.
 * Without any measurement there are no figures, and no „Gemessen“ either.
 */
export type Assessment =
  | (Figures & {
      status: Verdict | { kind: "lastMeasurementTooOld"; days: number };
    })
  | {
      status: { kind: "noVerdictYet" };
      measuredKg: null;
      trend: null;
    };

/** What the page says above the figures: a verdict, or why there is none. */
export type AssessmentStatus = Assessment["status"];

/**
 * The Urteil of the last day with a measurement: its Ampel, its Sicherheit
 * and its Satz zum Morgen.
 */
export interface Verdict {
  kind: "verdict";
  trafficLight: TrafficLight;
  lossCertainty: number;
  morningSentence: MorningSentence;
}

interface Figures {
  /** „Gemessen“: the counting measurement of the last day with a measurement. */
  measuredKg: number;
  /** The trend of that day: „Gewicht, geschätzt“, „Tempo“ and the calories. */
  trend: Trend;
}

/**
 * The assessment on `today` from `counting` (ordered by day): the verdict of
 * the last day with a measurement, or „Noch kein Urteil“ without any.
 *
 * The last measurement more than 3 days before `today` replaces the verdict;
 * the figures stay.
 */
export function assess(
  counting: CountingMeasurement[],
  today: CalendarDay,
): Assessment {
  const last = counting.at(-1);
  if (last === undefined) {
    return {
      status: { kind: "noVerdictYet" },
      measuredKg: null,
      trend: null,
    };
  }

  const days = daysBetween(last.day, today);
  const everyTrend = trends(counting);
  return {
    status:
      days > MAX_DAYS_SINCE_LAST_MEASUREMENT
        ? { kind: "lastMeasurementTooOld", days }
        : verdict(everyTrend),
    measuredKg: last.kg,
    trend: everyTrend[everyTrend.length - 1],
  };
}

/**
 * What the page of `day` knows of `measurements`: those taken up to and
 * including that Berlin calendar day, counting or not. Its assessment comes
 * from their counting measurements, its „Letzte Messung“ from their newest.
 */
export function measurementsKnownOn(
  measurements: Measurement[],
  day: CalendarDay,
): Measurement[] {
  // `YYYY-MM-DD` orders as text the way the days do.
  return measurements.filter(
    (measurement) => berlinDay(measurement.time) <= day,
  );
}

/**
 * Whether the page of `day` is that of an earlier day, given `counting`
 * (ordered by day): a day with a counting measurement, but not the last.
 */
export function isEarlierDay(
  counting: CountingMeasurement[],
  day: CalendarDay,
): boolean {
  return counting.slice(0, -1).some((measurement) => measurement.day === day);
}

const MAX_DAYS_SINCE_LAST_MEASUREMENT = 3;

/** The verdict of the last of `everyTrend`, of which there is at least one. */
function verdict(everyTrend: Trend[]): Verdict {
  const last = everyTrend[everyTrend.length - 1];
  return {
    kind: "verdict",
    trafficLight: trafficLight(last),
    lossCertainty: lossCertainty(last),
    morningSentence: morningSentence(everyTrend),
  };
}
