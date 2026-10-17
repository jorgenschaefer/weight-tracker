import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";
import { findGaps } from "@/measurement/gap";
import { countingMeasurements } from "@/measurement/measurement";
import type { Trend } from "@/trend/trend";
import { compareAfterGap, gapUnderComparison } from "./gap-comparison";

/** Counting measurements, one per `[day, kg]`, each at 05:00 UTC, early morning in Berlin. */
const measured = (...days: [string, number][]) =>
  countingMeasurements(
    days.map(([day, kg]) => ({ time: new Date(`${day}T05:00:00Z`), kg })),
  );

describe("gapUnderComparison", () => {
  const beforeGap: [string, number][] = [
    ["2026-09-20", 99.0],
    ["2026-09-21", 99.0],
    ["2026-09-22", 99.0],
  ];

  it("is the last gap, until its 5th counting measurement after it", () => {
    const counting = measured(
      ...beforeGap,
      ["2026-10-01", 99.0],
      ["2026-10-02", 99.0],
      ["2026-10-03", 99.0],
      ["2026-10-04", 99.0],
    );

    expect(gapUnderComparison(counting)).toEqual(findGaps(counting)[0]);
  });

  it("is the later of two gaps", () => {
    const counting = measured(
      ...beforeGap,
      ["2026-10-01", 99.0],
      ["2026-10-02", 99.0],
      ["2026-10-08", 99.0],
    );

    expect(gapUnderComparison(counting)?.firstDayAfter).toBe("2026-10-08");
  });

  it("is none from the 5th counting measurement after the gap on", () => {
    const counting = measured(
      ...beforeGap,
      ["2026-10-01", 99.0],
      ["2026-10-02", 99.0],
      ["2026-10-03", 99.0],
      ["2026-10-04", 99.0],
      ["2026-10-05", 99.0],
    );

    expect(gapUnderComparison(counting)).toBeNull();
  });

  it("is none without a gap", () => {
    expect(gapUnderComparison(measured(...beforeGap))).toBeNull();
    expect(gapUnderComparison([])).toBeNull();
  });
});

describe("compareAfterGap", () => {
  /**
   * The 12 days up to 22.9. with a trend of 99.0 kg each and measurements
   * 0.5 kg off it, alternately below and above: a spread s of 0.5 kg.
   */
  const before: [string, number][] = Array.from({ length: 12 }, (_, i) => [
    calendarDayBefore("2026-09-22" as CalendarDay, i),
    i % 2 === 0 ? 98.5 : 99.5,
  ]);
  const trendsBefore = before.map(([day]) => trendOf(day, 99.0));

  const comparison = (after: [string, number][], trends = trendsBefore) => {
    const counting = measured(...before.toReversed(), ...after);
    return compareAfterGap(counting, trends, findGaps(counting)[0]);
  };

  it("gives the days of the gap and the median after it against the trend before it", () => {
    expect(
      comparison([
        ["2026-10-01", 99.4],
        ["2026-10-02", 99.9],
        ["2026-10-03", 99.6],
      ]),
    ).toMatchObject({ kind: "gapComparison", gapDays: 9 });
    expect(
      comparison([
        ["2026-10-01", 99.4],
        ["2026-10-02", 99.9],
        ["2026-10-03", 99.6],
      ])?.differenceKg,
    ).toBeCloseTo(0.6);
  });

  it("takes the median of an even number as the mean of the middle two", () => {
    expect(
      comparison([
        ["2026-10-01", 99.4],
        ["2026-10-02", 99.9],
        ["2026-10-03", 99.6],
        ["2026-10-04", 99.7],
      ])?.differenceKg,
    ).toBeCloseTo(0.65);
  });

  it.each([
    [100.0, "withinNormalVariation"],
    [100.1, "clearIncrease"],
    [98.0, "withinNormalVariation"],
    [97.9, "clearDecrease"],
  ])(
    "with one measurement after the gap, calls %d kg %s: more than 2 · s / √1 = 1.0 kg is clear",
    (kg, variation) => {
      expect(comparison([["2026-10-01", kg]])?.variation).toBe(variation);
    },
  );

  it("narrows what is clear by √n: 4 measurements, 0.6 kg against 0.5 kg", () => {
    expect(
      comparison([
        ["2026-10-01", 99.6],
        ["2026-10-02", 99.6],
        ["2026-10-03", 99.6],
        ["2026-10-04", 99.6],
      ])?.variation,
    ).toBe("clearIncrease");
  });

  it("takes the spread from the 4 weeks up to the last day before the gap", () => {
    const farBack = measured(["2026-08-25", 109.0], ...before.toReversed(), [
      "2026-10-01",
      100.1,
    ]);
    const trends = [trendOf("2026-08-25", 99.0), ...trendsBefore];

    expect(
      compareAfterGap(farBack, trends, findGaps(farBack)[1])?.variation,
    ).toBe("clearIncrease");

    const justInside = measured(["2026-08-26", 109.0], ...before.toReversed(), [
      "2026-10-01",
      100.1,
    ]);
    const trendsInside = [trendOf("2026-08-26", 99.0), ...trendsBefore];

    expect(
      compareAfterGap(justInside, trendsInside, findGaps(justInside)[1])
        ?.variation,
    ).toBe("withinNormalVariation");
  });

  it("leaves out of the spread the measurements after the gap", () => {
    const counting = measured(...before.toReversed(), ["2026-10-01", 100.1]);
    const withTrendAfter = [...trendsBefore, trendOf("2026-10-01", 99.0)];

    expect(
      compareAfterGap(counting, withTrendAfter, findGaps(counting)[0])
        ?.variation,
    ).toBe("clearIncrease");
  });

  it("leaves out of the spread the measurements whose day has no trend", () => {
    const withoutTrend = trendsBefore.filter(({ day }) => day !== "2026-09-21");
    const counting = measured(
      ...before
        .toReversed()
        .map(([day, kg]): [string, number] => [
          day,
          day === "2026-09-21" ? 109.0 : kg,
        ]),
      ["2026-10-01", 100.1],
    );

    expect(
      compareAfterGap(counting, withoutTrend, findGaps(counting)[0])?.variation,
    ).toBe("clearIncrease");
  });

  it("is none where the last day before the gap has no trend", () => {
    const withoutLast = trendsBefore.filter(({ day }) => day !== "2026-09-22");

    expect(comparison([["2026-10-01", 99.0]], withoutLast)).toBeNull();
  });
});

function trendOf(day: string, kg: number): Trend {
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  return { day: day as CalendarDay, kg, slopePerWeek: 0 };
}
