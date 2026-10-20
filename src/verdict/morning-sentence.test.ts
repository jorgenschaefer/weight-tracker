import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";
import { countingMeasurements } from "@/measurement/measurement";
import { weightHistoryUntil } from "@/test/weight-history-fixture";
import { type Trend, trends } from "@/trend/trend";
import { type MorningSentence, morningSentence } from "./morning-sentence";
import type { TrafficLight } from "./traffic-light";

/** Each Ampel's pace, in kg per week, at a standard deviation of 0.3. */
const PACE: Record<TrafficLight, number> = {
  green: -1,
  yellow: -0.1,
  red: 1,
};

/**
 * A trend on `day` that makes `light`, with the measurement `z` standard
 * deviations off; yellow with the pace under -0.1 kg per week at the
 * probability `certainty`: 0.5 by default (an even chance), or about 0.37 at
 * a pace of 0.
 */
function trendOn(
  day: string,
  light: TrafficLight,
  z = 0,
  certainty: 0.5 | 0.37 = 0.5,
): Trend {
  return {
    // Safe: a valid `YYYY-MM-DD`.
    day: day as CalendarDay,
    kg: 97,
    kgVariance: 0.1,
    pace: PACE[light] + (certainty === 0.37 ? 0.1 : 0),
    paceVariance: 0.3 * 0.3,
    z,
  };
}

/** A day's Ampel, z and, where yellow, its {@link trendOn certainty}. */
type Day = [TrafficLight, number?, (0.5 | 0.37)?];

/** Trends on consecutive days up to 20.10.2026, one per entry of `days`. */
function daysUntilOctober20(...days: Day[]): Trend[] {
  return days.map(([light, z, certainty], i) =>
    trendOn(
      // Safe: a valid `YYYY-MM-DD`.
      calendarDayBefore("2026-10-20" as CalendarDay, days.length - 1 - i),
      light,
      z,
      certainty,
    ),
  );
}

describe("morningSentence (AC-4)", () => {
  it.each<[string, MorningSentence, Day[]]>([
    ["1. red, then yellow", { kind: "gainStopped" }, [["red"], ["yellow"]]],
    ["2. green, then yellow", { kind: "lossSlowing" }, [["green"], ["yellow"]]],
    ["3. yellow, then green", { kind: "losingAgain" }, [["yellow"], ["green"]]],
    ["3. red, then green", { kind: "losingAgain" }, [["red"], ["green"]]],
    ["4. yellow, then red", { kind: "gainingAgain" }, [["yellow"], ["red"]]],
    ["4. green, then red", { kind: "gainingAgain" }, [["green"], ["red"]]],
    ["5. green, z over 2", { kind: "outlier" }, [["green"], ["green", 2.01]]],
    ["6. red, z under -2", { kind: "lightMorning" }, [["red"], ["red", -2.01]]],
    [
      "7. green, z over 1 today and yesterday",
      { kind: "twoHeavierMornings" },
      [
        ["green", 1.01],
        ["green", 1.01],
      ],
    ],
    ["8. green", { kind: "losingForDays", days: 2 }, [["green"], ["green"]]],
    [
      "9. yellow, the pace under -0.1 kg per week at 50 %",
      { kind: "probablyLosing" },
      [["yellow"], ["yellow"]],
    ],
    [
      "10. yellow, the pace under -0.1 kg per week at 37 %",
      { kind: "open" },
      [["yellow"], ["yellow", 0, 0.37]],
    ],
    ["11. red", { kind: "gainingForDays", days: 2 }, [["red"], ["red"]]],
  ])("%s gives %o", (_, expected, days) => {
    expect(morningSentence(daysUntilOctober20(...days))).toEqual(expected);
  });
});

describe("morningSentence: where z lies (AC-4)", () => {
  it.each<[string, MorningSentence, Day[]]>([
    [
      "green, z exactly 2",
      { kind: "losingForDays", days: 2 },
      [["green"], ["green", 2]],
    ],
    [
      "green, z under -2",
      { kind: "losingForDays", days: 2 },
      [["green"], ["green", -3]],
    ],
    [
      "red, z exactly -2",
      { kind: "gainingForDays", days: 2 },
      [["red"], ["red", -2]],
    ],
    [
      "red, z over 2",
      { kind: "gainingForDays", days: 2 },
      [["red"], ["red", 3]],
    ],
    [
      "green, z exactly 1 today, over 1 yesterday",
      { kind: "losingForDays", days: 2 },
      [
        ["green", 1.5],
        ["green", 1],
      ],
    ],
    [
      "green, z over 1 today, exactly 1 yesterday",
      { kind: "losingForDays", days: 2 },
      [
        ["green", 1],
        ["green", 1.5],
      ],
    ],
    [
      "green, z over 1 today only",
      { kind: "losingForDays", days: 2 },
      [
        ["green", 0.5],
        ["green", 1.5],
      ],
    ],
    [
      "green, z over 1 yesterday only",
      { kind: "losingForDays", days: 2 },
      [
        ["green", 1.5],
        ["green", 0.5],
      ],
    ],
  ])("%s gives %o", (_, expected, days) => {
    expect(morningSentence(daysUntilOctober20(...days))).toEqual(expected);
  });
});

describe("morningSentence: the first that applies (AC-4)", () => {
  it.each<[string, MorningSentence, Day[]]>([
    ["3 before 5", { kind: "losingAgain" }, [["yellow"], ["green", 3]]],
    ["4 before 6", { kind: "gainingAgain" }, [["yellow"], ["red", -3]]],
    [
      "5 before 7",
      { kind: "outlier" },
      [
        ["green", 1.5],
        ["green", 2.5],
      ],
    ],
  ])("%s: %o", (_, expected, days) => {
    expect(morningSentence(daysUntilOctober20(...days))).toEqual(expected);
  });
});

describe("morningSentence on the first day with a measurement (AC-4)", () => {
  it.each<[string, MorningSentence, Day]>([
    ["red", { kind: "gainingForDays", days: 1 }, ["red"]],
    ["green", { kind: "losingForDays", days: 1 }, ["green"]],
    ["yellow at 50 %", { kind: "probablyLosing" }, ["yellow"]],
  ])("takes the Ampel as unchanged: %s gives %o", (_, expected, day) => {
    expect(morningSentence(daysUntilOctober20(day))).toEqual(expected);
  });

  it("is not there without any", () => {
    expect(() => morningSentence([])).toThrow(
      "morningSentence needs the trend of at least one day",
    );
  });
});

describe("morningSentence: how long a colour has held (AC-4)", () => {
  const times = (n: number, day: Day): Day[] => Array(n).fill(day);

  it.each<[number, MorningSentence, MorningSentence]>([
    [
      13,
      { kind: "losingForDays", days: 13 },
      { kind: "gainingForDays", days: 13 },
    ],
    [14, { kind: "losingForWeeks" }, { kind: "gainingForWeeks" }],
    [40, { kind: "losingForWeeks" }, { kind: "gainingForWeeks" }],
  ])("after %i days is %o, or %o", (days, green, red) => {
    expect(
      morningSentence(
        daysUntilOctober20(["yellow"], ...times(days, ["green"])),
      ),
    ).toEqual(green);
    expect(
      morningSentence(daysUntilOctober20(["yellow"], ...times(days, ["red"]))),
    ).toEqual(red);
  });

  it("counts calendar days, with and without a measurement", () => {
    const trends = [
      trendOn("2026-10-14", "yellow"),
      trendOn("2026-10-15", "green"),
      trendOn("2026-10-20", "green"),
    ];

    expect(morningSentence(trends)).toEqual({ kind: "losingForDays", days: 6 });
  });

  it("counts from the first day of the colour after another", () => {
    expect(
      morningSentence(
        daysUntilOctober20(
          ["red"],
          ["red"],
          ["red"],
          ["yellow"],
          ["red"],
          ["red"],
        ),
      ),
    ).toEqual({ kind: "gainingForDays", days: 2 });
  });
});

describe("morningSentence on the test data (AC-7)", () => {
  it.each<[string, MorningSentence]>([
    ["2026-07-13", { kind: "gainingAgain" }],
    ["2026-07-14", { kind: "gainingForDays", days: 2 }],
    ["2026-10-01", { kind: "gainingForWeeks" }],
    ["2026-10-03", { kind: "lightMorning" }],
    ["2026-10-04", { kind: "gainStopped" }],
    ["2026-10-05", { kind: "open" }],
    ["2026-10-06", { kind: "probablyLosing" }],
    ["2026-10-08", { kind: "losingAgain" }],
    ["2026-10-09", { kind: "losingForDays", days: 2 }],
    ["2026-10-12", { kind: "outlier" }],
    ["2026-10-13", { kind: "losingForDays", days: 6 }],
    ["2026-10-17", { kind: "twoHeavierMornings" }],
    ["2026-10-18", { kind: "lossSlowing" }],
    ["2026-10-19", { kind: "losingAgain" }],
    ["2026-10-20", { kind: "losingForDays", days: 2 }],
  ])("on %s is %o", (day, expected) => {
    const counting = countingMeasurements(weightHistoryUntil(day));

    expect(morningSentence(trends(counting))).toEqual(expected);
  });
});
