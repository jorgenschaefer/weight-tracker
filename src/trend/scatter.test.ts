import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
} from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { scatter, sortAgainstThreshold, threshold } from "./scatter";
import { type Trend, trends } from "./trend";

// Safe: a valid `YYYY-MM-DD`.
const october20 = "2026-10-20" as CalendarDay;

/**
 * Counting measurements on the `offsets.length` days ending `daysBefore`
 * days before 20.10., each `offset` kg from a trend of 98 kg on its day.
 */
function aroundTrend(offsets: number[], daysBefore = 1) {
  const days = offsets.map((_, i) =>
    calendarDayBefore(october20, daysBefore + offsets.length - 1 - i),
  );
  const counting: CountingMeasurement[] = days.map((day, i) => ({
    time: new Date(`${day}T05:00:00Z`),
    kg: 98 + offsets[i],
    day,
  }));
  const trendOfDays: Trend[] = days.map((day) => ({
    day,
    kg: 98,
  }));
  return { counting, trends: trendOfDays };
}

const tenOffsets = [0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5];

describe("scatter", () => {
  it("is the root mean square of the measurements' distances from their day's trend", () => {
    const { counting, trends } = aroundTrend([
      0.3, -0.6, 0.9, 0, 0.2, -0.4, 0.1, -0.1, 0.5, -0.8,
    ]);

    expect(scatter(counting, trends, october20)).toBeCloseTo(
      // The squares add up to 2.37.
      Math.sqrt(2.37 / 10),
    );
  });

  it("is 0.7 kg with fewer than 10 distances", () => {
    const { counting, trends } = aroundTrend(tenOffsets.slice(1));

    expect(scatter(counting, trends, october20)).toBe(0.7);
  });

  it("counts the 28 days before the day, not the day itself", () => {
    const tenBefore = aroundTrend(tenOffsets);
    const theDay = aroundTrend([3], 0);
    const counting = [...tenBefore.counting, ...theDay.counting];
    const trendOfDays = [...tenBefore.trends, ...theDay.trends];

    expect(scatter(counting, trendOfDays, october20)).toBeCloseTo(0.5);
  });

  it("counts the 28th day before the day, not the 29th", () => {
    const nineAt28 = aroundTrend(tenOffsets.slice(1), 20);
    const at29 = aroundTrend([3], 29);
    const at28 = aroundTrend([0.5], 28);

    expect(
      scatter(
        [...at29.counting, ...nineAt28.counting],
        [...at29.trends, ...nineAt28.trends],
        october20,
      ),
    ).toBe(0.7);
    expect(
      scatter(
        [...at28.counting, ...nineAt28.counting],
        [...at28.trends, ...nineAt28.trends],
        october20,
      ),
    ).toBeCloseTo(0.5);
  });

  it("leaves out a measurement whose day has no trend", () => {
    const tenBefore = aroundTrend(tenOffsets);
    const withoutTrend = aroundTrend([3], 15).counting;

    expect(
      scatter(
        [...withoutTrend, ...tenBefore.counting],
        tenBefore.trends,
        october20,
      ),
    ).toBeCloseTo(0.5);
  });

  it("is about 0.81 kg on 16.10. of the real history", () => {
    const counting = countingMeasurements(weightHistory());

    expect(
      scatter(counting, trends(counting), "2026-10-16" as CalendarDay),
    ).toBeCloseTo(1.01 / 1.25, 2);
  });
});

describe("threshold", () => {
  it.each([
    ["morning", 1.25],
    ["weekPace", 1.25 * 0.8],
    ["fortnightPace", 1.25 * 0.39],
    ["pace", 1.25 * 0.2],
  ] as const)(
    "of %s is 1.25 times its noise factor times the scatter",
    (check, factor) => {
      expect(threshold(check, 0.8)).toBeCloseTo(factor * 0.8, 10);
    },
  );
});

describe("sortAgainstThreshold", () => {
  it.each([
    [1.01, 1.0, "above"],
    [1.0, 1.0, "between"],
    [0, 1.0, "between"],
    [-1.0, 1.0, "between"],
    [-1.01, 1.0, "below"],
    // 96.8 lies 0.9000000000000057 from 97.7.
    [96.8 - 97.7, 0.9, "between"],
    [98.6 - 97.7, 0.9, "between"],
    [98.6004 - 97.7, 0.9, "above"],
  ] as const)("sorts %d against %d as %s", (value, limit, side) => {
    expect(sortAgainstThreshold(value, limit)).toBe(side);
  });
});
