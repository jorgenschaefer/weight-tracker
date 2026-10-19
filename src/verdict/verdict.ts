import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import { findGaps } from "@/measurement/gap";
import type { CountingMeasurement } from "@/measurement/measurement";
import { scatter, sortAgainstThreshold, threshold } from "@/trend/scatter";
import type { Trend } from "@/trend/trend";
import { fortnightPace, weekPace } from "@/trend/week-pace";

/**
 * The Frühwarnung the headline shows on the last day with a measurement -
 * „Nimmt ab“, „Stagniert“ or „Nimmt zu“ - and for how many
 * {@link Duration days}; „Stagniert“ and „Nimmt zu“ on the {@link Level}
 * of those days.
 */
export type TrendVerdict =
  | ({ kind: "losing" } & Duration)
  | ({ kind: "holding" | "gaining" } & Duration & { level: Level });

/**
 * The days since the last day with a measurement on which the headline
 * showed something else - „at least“ where it showed no Frühwarnung then.
 */
export interface Duration {
  days: number;
  atLeast: boolean;
}

/** The Warnstufe of „Stagniert“ and „Nimmt zu“: 1–6, 7–13, or 14 and more days. */
export type Level = 1 | 2 | 3;

/**
 * The Frühwarnung in the headline on the day of the last of `counting`
 * (ordered by day), from `trends` up to it (ordered by day); none where that
 * day has no 14-day pace.
 *
 * Each day's paces are compared only with the days from the first counting
 * measurement after the last gap on, and judged against their thresholds on
 * the day's Streuung. The headline shows a new Frühwarnung once it holds on
 * {@link CONFIRMING_DAYS} days with a measurement in a row, and the first
 * one at once.
 */
export function trendVerdict(
  trends: Trend[],
  counting: CountingMeasurement[],
): TrendVerdict | null {
  const lastDay = lastOf(counting).day;
  const firstComparable = firstCountedDay(counting);
  const shown = headlines(
    counting.map((measurement) =>
      verdictKindOn(measurement.day, counting, trends, firstComparable),
    ),
  );
  const kind = shown[shown.length - 1];
  if (kind === null) return null;
  const changedAt = shown.findLastIndex((headline) => headline !== kind);
  // The first counting measurement has no day 14 days before it to compare
  // with, so the headline shows no Frühwarnung there.
  if (changedAt === -1) {
    throw new Error(
      `trendVerdict found a 14-day pace on every day up to ${lastDay}, the first counting measurement's too`,
    );
  }
  const duration = {
    days: daysBetween(counting[changedAt].day, lastDay),
    atLeast: shown[changedAt] === null,
  };
  if (kind === "losing") return { kind, ...duration };
  return { kind, ...duration, level: level(duration.days) };
}

/** On how many days with a measurement in a row a new Frühwarnung holds before the headline shows it. */
const CONFIRMING_DAYS = 2;

/**
 * What the headline shows on each day of `sayings`, what the Frühwarnung
 * says on the days with a measurement: what it says on the first day it
 * says something, after that what it has said on the last
 * {@link CONFIRMING_DAYS} days where they agree, otherwise what it showed
 * the day before.
 */
function headlines(sayings: (VerdictKind | null)[]): (VerdictKind | null)[] {
  const shown: (VerdictKind | null)[] = [];
  sayings.forEach((saying, i) => {
    const before = i === 0 ? null : shown[i - 1];
    const confirmed =
      i + 1 >= CONFIRMING_DAYS &&
      sayings
        .slice(i + 1 - CONFIRMING_DAYS, i)
        .every((earlier) => earlier === saying);
    shown.push(
      saying === null || before === null || confirmed ? saying : before,
    );
  });
  return shown;
}

type VerdictKind = TrendVerdict["kind"];

/**
 * What the Frühwarnung says on `day`: the 7-day pace where it lies beyond
 * its threshold, otherwise the 14-day pace; nothing where it has no 14-day
 * pace.
 */
function verdictKindOn(
  day: CalendarDay,
  counting: CountingMeasurement[],
  trends: Trend[],
  firstComparable: CalendarDay,
): VerdictKind | null {
  const fortnight = fortnightPace(trends, day, firstComparable);
  if (fortnight === null) return null;
  const scatterKg = scatter(counting, trends, day);
  const week = weekPace(trends, day, firstComparable);
  const weekSays =
    week === null
      ? "between"
      : sortAgainstThreshold(week, threshold("weekPace", scatterKg));
  if (weekSays !== "between") return KINDS[weekSays];
  return KINDS[
    sortAgainstThreshold(fortnight, threshold("fortnightPace", scatterKg))
  ];
}

const KINDS = {
  below: "losing",
  between: "holding",
  above: "gaining",
} as const satisfies Record<
  ReturnType<typeof sortAgainstThreshold>,
  VerdictKind
>;

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
