import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
  daysBetween,
} from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import type { Trend } from "@/trend/trend";
import { trendVerdict } from "./verdict";

/** A trend on `day` with `slopePerWeek`, of `kg` for its 4-day pace. */
const trend = (day: string, slopePerWeek: number, kg = 98.0): Trend => ({
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg,
  slopePerWeek,
});

describe("trendVerdict", () => {
  it("is „Nimmt ab“ while the trend falls faster than 0.2 kg per week", () => {
    const history = [trend("2026-10-16", 0.1), trend("2026-10-17", -0.21)];

    expect(trendVerdict(history, measuredOn(history, "2026-10-17"))).toEqual({
      kind: "losing",
    });
  });

  it("is „Nimmt ab“ while the 4-day pace falls faster than 0.2 kg per week too", () => {
    const history = [
      trend("2026-10-13", -0.5, 98.4),
      trend("2026-10-17", -0.5, 98.0),
    ];

    expect(trendVerdict(history, measuredOn(history, "2026-10-17"))).toEqual({
      kind: "losing",
    });
  });

  it("does not count a falling slope as falling where the 4-day pace does not fall", () => {
    const history = [
      trend("2026-10-10", -0.5),
      trend("2026-10-14", -0.5),
      trend("2026-10-17", -0.5),
    ];

    expect(
      trendVerdict(history, measuredOn(history, "2026-10-17")),
    ).toMatchObject({ kind: "noDecrease", days: 7, since: "2026-10-10" });
  });

  it("does not count a 4-day pace of exactly -0.2 kg per week as falling, though it comes out a hair below", () => {
    const history = [
      trend("2026-10-09", -0.5),
      trend("2026-10-10", -0.5, 98.0),
      trend("2026-10-17", -0.5, 97.8),
    ];

    expect(
      trendVerdict(history, measuredOn(history, "2026-10-17")),
    ).toMatchObject({ kind: "noDecrease", days: 7, since: "2026-10-10" });
  });

  it("is no decrease since N days, from the last day with a falling trend", () => {
    const history = [
      trend("2026-10-10", -0.5),
      trend("2026-10-11", -0.1),
      trend("2026-10-17", 0.1),
    ];

    expect(trendVerdict(history, measuredOn(history, "2026-10-17"))).toEqual({
      kind: "noDecrease",
      days: 7,
      atLeast: false,
      since: "2026-10-10",
      level: 2,
    });
  });

  it.each([
    ["2026-10-15", "losing"],
    ["2026-10-16", "losing"],
    ["2026-10-17", "noDecrease"],
  ])(
    "confirms no decrease only from 3 days on: last day %s is %s",
    (lastDay, kind) => {
      const history = [trend("2026-10-14", -0.5), trend("2026-10-15", 0.0)];

      expect(trendVerdict(history, measuredOn(history, lastDay)).kind).toBe(
        kind,
      );
    },
  );

  it.each([
    [3, 1],
    [6, 1],
    [7, 2],
    [13, 2],
    [14, 3],
    [40, 3],
  ])("puts no decrease since %d days on level %d", (days, level) => {
    const history = [trend("2026-09-01", -0.5)];
    const lastDay = calendarDayAfter("2026-09-01", days);

    expect(trendVerdict(history, measuredOn(history, lastDay))).toMatchObject({
      days,
      level,
    });
  });

  it("does not count a trend falling at exactly 0.2 kg per week as falling, though its 4-day pace falls", () => {
    const history = [
      trend("2026-10-10", -0.21, 98.0),
      trend("2026-10-17", -0.2, 97.0),
    ];

    expect(
      trendVerdict(history, measuredOn(history, "2026-10-17")),
    ).toMatchObject({
      kind: "noDecrease",
      days: 7,
    });
  });

  it("does not count 0.2 kg in 7 days as falling, though the slope comes out a hair below -0.2", () => {
    const slopeOfTwoTenthsInAWeek = ((98.6 - 98.8) / 7) * 7;
    const history = [
      trend("2026-10-10", -0.21, 98.0),
      trend("2026-10-17", slopeOfTwoTenthsInAWeek, 97.0),
    ];

    expect(slopeOfTwoTenthsInAWeek).toBeLessThan(-0.2);
    expect(
      trendVerdict(history, measuredOn(history, "2026-10-17")),
    ).toMatchObject({
      kind: "noDecrease",
      days: 7,
    });
  });

  it("is no decrease since at least N days, from the first counting measurement, where no trend ever fell", () => {
    const history = [
      trend("2026-10-05", -0.2),
      trend("2026-10-09", 0.3),
      trend("2026-10-17", 0.1),
    ];
    const counting = measuredEveryDay("2026-10-01", "2026-10-17");

    expect(trendVerdict(history, counting)).toEqual({
      kind: "noDecrease",
      days: 16,
      atLeast: true,
      since: "2026-10-01",
      level: 3,
    });
  });

  it("is no decrease since at least N days from the first day with a trend on, where no trend ever fell", () => {
    const history = [trend("2026-10-05", 0.3)];
    const counting = measuredOnDays(
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
    );

    expect(trendVerdict(history, counting)).toEqual({
      kind: "noDecrease",
      days: 4,
      atLeast: true,
      since: "2026-10-01",
      level: 1,
    });
  });

  it("counts after the last gap from its first day, where no trend has fallen since", () => {
    const history = [
      trend("2026-08-01", -1.0),
      trend("2026-09-01", -1.0),
      trend("2026-10-05", 0.0),
    ];
    const counting = measuredOnDays(
      "2026-08-01",
      "2026-09-01",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
    );

    expect(trendVerdict(history, counting)).toEqual({
      kind: "noDecrease",
      days: 4,
      atLeast: true,
      since: "2026-10-01",
      level: 1,
    });
  });

  it("counts after a gap from the last falling day since it, confirmed after 3 days", () => {
    const history = [
      trend("2026-09-01", -1.0),
      trend("2026-10-02", -0.5),
      trend("2026-10-04", 0.0),
    ];
    const lastDays = ["2026-10-04", "2026-10-05"];
    const verdicts = lastDays.map((lastDay) =>
      trendVerdict(
        history,
        measuredOnDays("2026-09-01", "2026-10-01", "2026-10-02", lastDay),
      ),
    );

    expect(verdicts).toEqual([
      { kind: "losing" },
      {
        kind: "noDecrease",
        days: 3,
        atLeast: false,
        since: "2026-10-02",
        level: 1,
      },
    ]);
  });
});

describe("trendVerdict: „Nimmt zu“", () => {
  it("is „Nimmt zu“ where the 4-day pace of the last day is over +1.0 kg per week, with the days without a decrease", () => {
    const history = [
      trend("2026-10-10", -0.5, 97.0),
      trend("2026-10-11", -0.5, 97.0),
      trend("2026-10-15", 0.1, 97.7),
    ];

    expect(trendVerdict(history, measuredOn(history, "2026-10-15"))).toEqual({
      kind: "gaining",
      days: 4,
      atLeast: false,
      since: "2026-10-11",
      level: 1,
    });
  });

  it("is „Nimmt zu“ before the 3 days of confirmation are up, on the first level", () => {
    const history = [
      trend("2026-10-10", -0.5, 97.0),
      trend("2026-10-12", -0.5, 97.0),
      trend("2026-10-14", 0.1, 97.7),
    ];

    expect(trendVerdict(history, measuredOn(history, "2026-10-14"))).toEqual({
      kind: "gaining",
      days: 2,
      atLeast: false,
      since: "2026-10-12",
      level: 1,
    });
  });

  it("is „Nimmt zu“ on the level of its days without a decrease", () => {
    const history = [
      trend("2026-10-10", -0.5, 97.0),
      trend("2026-10-13", 0.1, 97.0),
      trend("2026-10-17", 0.1, 97.7),
    ];

    expect(
      trendVerdict(history, measuredOn(history, "2026-10-17")),
    ).toMatchObject({ kind: "gaining", days: 7, level: 2 });
  });

  it("is „Nimmt zu“ since at least N days where no trend fell", () => {
    const history = [
      trend("2026-10-10", 0.5, 97.0),
      trend("2026-10-14", 0.5, 97.7),
    ];

    expect(trendVerdict(history, measuredOn(history, "2026-10-14"))).toEqual({
      kind: "gaining",
      days: 4,
      atLeast: true,
      since: "2026-10-10",
      level: 1,
    });
  });

  it("compares the 4-day pace only with days after the last gap", () => {
    const history = [
      trend("2026-09-21", -0.5, 96.9),
      trend("2026-09-25", -0.5, 98.0),
      trend("2026-09-28", -0.5, 98.0),
    ];
    const counting = [
      ...measuredEveryDay("2026-09-15", "2026-09-21"),
      ...measuredEveryDay("2026-09-25", "2026-09-28"),
    ];

    expect(trendVerdict(history, counting)).toEqual({ kind: "losing" });
  });

  it("is not „Nimmt zu“ at a 4-day pace of +1.0 kg per week, though it comes out a hair above", () => {
    const sixDaysOfAKiloAWeek = 98.0 + 6 / 7;
    const history = [
      trend("2026-10-09", -0.5, 98.0),
      trend("2026-10-15", 0.1, sixDaysOfAKiloAWeek),
    ];

    expect(((sixDaysOfAKiloAWeek - 98.0) / 6) * 7).toBeGreaterThan(1.0);
    expect(trendVerdict(history, measuredOn(history, "2026-10-15"))).toEqual({
      kind: "noDecrease",
      days: 6,
      atLeast: false,
      since: "2026-10-09",
      level: 1,
    });
  });
});

/**
 * A counting measurement on every day from the first of `history` to
 * `lastDay`, with no gap; their weights play no part in the verdict.
 */
function measuredOn(history: Trend[], lastDay: string): CountingMeasurement[] {
  return measuredEveryDay(history[0].day, lastDay);
}

/** A counting measurement on every day from `first` to `last`. */
function measuredEveryDay(first: string, last: string): CountingMeasurement[] {
  const days = daysBetween(first as CalendarDay, last as CalendarDay);
  return measuredOnDays(
    ...Array.from({ length: days + 1 }, (_, i) => calendarDayAfter(first, i)),
  );
}

/** A counting measurement on each of `days`; their weights play no part. */
function measuredOnDays(...days: string[]): CountingMeasurement[] {
  return days.map((day) => ({
    time: new Date(`${day}T07:00:00+02:00`),
    kg: 98.0,
    // Safe: every day these tests write is a valid `YYYY-MM-DD`.
    day: day as CalendarDay,
  }));
}

/** The day `days` days after `day`. */
function calendarDayAfter(day: string, days: number): CalendarDay {
  return calendarDayBefore(day as CalendarDay, -days);
}
