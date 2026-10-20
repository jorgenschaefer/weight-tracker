import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import { type Pace, pace } from "@/trend/pace";
import { scatter } from "@/trend/scatter";
import { type SixWeekSeries, sixWeekSeries } from "@/trend/six-week-series";
import { trends as theilSenTrends } from "@/trend/theil-sen";
import { trends } from "@/trend/trend";
import { type MorningSentence, morningSentence } from "./morning-sentence";
import {
  lossCertainty,
  type TrafficLight,
  trafficLight,
} from "./traffic-light";

/**
 * Everything the page shows about the weight: exactly one status, and beside
 * it the figures of the last day with a measurement and the 6-week series.
 * Without any measurement there are no figures, and no „Gemessen“ either.
 */
export type Assessment =
  | (Figures & {
      status: Verdict | { kind: "lastMeasurementTooOld"; days: number };
    })
  | {
      status: { kind: "noVerdictYet" };
      measuredKg: null;
      trendKg: null;
      pace: null;
      sixWeekSeries: SixWeekSeries;
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
  /** The Theil-Sen trend of that day; none where it has none. */
  trendKg: number | null;
  /** The 4-week pace of that day; none where it has none. */
  pace: Pace | null;
  sixWeekSeries: SixWeekSeries;
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
  const series = sixWeekSeries(counting, today);
  const last = counting.at(-1);
  if (last === undefined) {
    return {
      status: { kind: "noVerdictYet" },
      measuredKg: null,
      trendKg: null,
      pace: null,
      sixWeekSeries: series,
    };
  }

  const days = daysBetween(last.day, today);
  const everyTheilSenTrend = theilSenTrends(counting);
  const theilSenTrendOfLast = everyTheilSenTrend.find(
    (trend) => trend.day === last.day,
  );
  const scatterOfLast = scatter(counting, everyTheilSenTrend, last.day);
  return {
    status:
      days > MAX_DAYS_SINCE_LAST_MEASUREMENT
        ? { kind: "lastMeasurementTooOld", days }
        : verdict(counting),
    measuredKg: last.kg,
    trendKg: theilSenTrendOfLast?.kg ?? null,
    pace: pace(everyTheilSenTrend, last.day, scatterOfLast),
    sixWeekSeries: series,
  };
}

const MAX_DAYS_SINCE_LAST_MEASUREMENT = 3;

/** The verdict of the last of `counting`, of which there is at least one. */
function verdict(counting: CountingMeasurement[]): Verdict {
  const everyTrend = trends(counting);
  const last = everyTrend[everyTrend.length - 1];
  return {
    kind: "verdict",
    trafficLight: trafficLight(last),
    lossCertainty: lossCertainty(last),
    morningSentence: morningSentence(everyTrend),
  };
}
