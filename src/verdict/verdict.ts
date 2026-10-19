import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { scatter, sortAgainstThreshold, threshold } from "@/trend/scatter";
import type { Trend } from "@/trend/trend";
import { weekPace } from "@/trend/week-pace";

/**
 * The Frühwarnung: what the 7-day pace of the last day with a measurement
 * says - „Nimmt ab“, „Stagniert“ or „Nimmt zu“ - and for how many
 * {@link Duration days}; „Stagniert“ and „Nimmt zu“ on the {@link Level}
 * of those days.
 */
export type TrendVerdict =
  | ({ kind: "losing" } & Duration)
  | ({ kind: "holding" | "gaining" } & Duration & { level: Level });

/**
 * The days since the last day with a measurement on which the Frühwarnung
 * said something else - „at least“ where it said nothing on that day.
 */
export interface Duration {
  days: number;
  atLeast: boolean;
}

/** The Warnstufe of „Stagniert“ and „Nimmt zu“: 1–6, 7–13, or 14 and more days. */
export type Level = 1 | 2 | 3;

/**
 * The Frühwarnung on the day of the last of `counting` (ordered by day), from
 * `trends` up to it (ordered by day); none where that day has no 7-day pace.
 *
 * Each day's 7-day pace is compared only with the days from the first
 * counting measurement after the last gap on, and judged against the
 * threshold of the 7-day pace on the day's Streuung.
 */
export function trendVerdict(
  trends: Trend[],
  counting: CountingMeasurement[],
): TrendVerdict | null {
  const lastDay = lastOf(counting).day;
  const firstComparable = firstCountedDay(counting);
  const sayingOn = (day: CalendarDay) =>
    verdictKindOn(day, counting, trends, firstComparable);
  const kind = sayingOn(lastDay);
  if (kind === null) return null;
  const changedOn = counting.findLast(
    (measurement) => sayingOn(measurement.day) !== kind,
  );
  // The first counting measurement has no day 7 days before it to compare
  // with, so the Frühwarnung says nothing there.
  if (changedOn === undefined) {
    throw new Error(
      `trendVerdict found a 7-day pace on every day up to ${lastDay}, the first counting measurement's too`,
    );
  }
  const duration = {
    days: daysBetween(changedOn.day, lastDay),
    atLeast: sayingOn(changedOn.day) === null,
  };
  if (kind === "losing") return { kind, ...duration };
  return { kind, ...duration, level: level(duration.days) };
}

/** What the Frühwarnung says on `day`; nothing where it has no 7-day pace. */
function verdictKindOn(
  day: CalendarDay,
  counting: CountingMeasurement[],
  trends: Trend[],
  firstComparable: CalendarDay,
): TrendVerdict["kind"] | null {
  const pace = weekPace(trends, day, firstComparable);
  if (pace === null) return null;
  const limit = threshold("sevenDayPace", scatter(counting, trends, day));
  switch (sortAgainstThreshold(pace, limit)) {
    case "below":
      return "losing";
    case "between":
      return "holding";
    case "above":
      return "gaining";
  }
}

function lastOf(counting: CountingMeasurement[]): CountingMeasurement {
  const last = counting.at(-1);
  if (last === undefined) {
    throw new Error("trendVerdict needs at least one counting measurement");
  }
  return last;
}

/** The first counting measurement's day, or after a gap the first after the last one. */
function firstCountedDay(counting: CountingMeasurement[]): CalendarDay {
  return findGaps(counting).at(-1)?.firstDayAfter ?? counting[0].day;
}

function level(days: number): Level {
  if (days < 7) return 1;
  if (days < 14) return 2;
  return 3;
}
