import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
} from "@/measurement/measurement";
import reference from "@/test/fixtures/kalman-reference.json";
import { weightHistoryUntil } from "@/test/weight-history-fixture";
import { trends } from "./trend";

const on = (day: string, kg: number): CountingMeasurement => ({
  time: new Date(`${day}T07:00:00+02:00`),
  // Safe: a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg,
});

describe("trends", () => {
  it("is empty without measurements", () => {
    expect(trends([])).toEqual([]);
  });

  it("starts at the first measurement, with a pace of 0 ± 0.5 kg per week", () => {
    expect(trends([on("2026-07-01", 95.9)])).toEqual([
      {
        day: "2026-07-01",
        kg: 95.9,
        kgVariance: 1,
        pace: 0,
        paceVariance: expect.closeTo(0.25, 12),
        z: 0,
      },
    ]);
  });
});

describe("trends on the test data (AC-1)", () => {
  const filtered = trends(
    countingMeasurements(weightHistoryUntil("2026-10-20")),
  );

  it("has a trend for every day with a counting measurement", () => {
    expect(filtered.map((trend) => trend.day)).toEqual(
      reference.map((expected) => expected.day),
    );
  });

  it.each(reference.map((expected, i) => [expected.day, expected, i] as const))(
    "on %s is what kalman.py's kalman gives",
    (_, expected, i) => {
      const trend = filtered[i];
      expect(trend.kg).toBeCloseTo(expected.level, 6);
      expect(trend.kgVariance).toBeCloseTo(expected.levelVariance, 6);
      expect(trend.pace).toBeCloseTo(expected.pacePerDay * 7, 6);
      expect(trend.paceVariance).toBeCloseTo(
        expected.pacePerDayVariance * 7 * 7,
        6,
      );
      expect(trend.z).toBeCloseTo(expected.z, 6);
    },
  );
});
