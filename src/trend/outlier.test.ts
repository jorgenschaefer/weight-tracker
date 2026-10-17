import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import { isOutlier } from "./outlier";
import type { Trend } from "./trend";

// Safe: a valid `YYYY-MM-DD`.
const day = "2026-10-12" as CalendarDay;

const measured = (kg: number): CountingMeasurement => ({
  time: new Date("2026-10-12T05:00:00Z"),
  kg,
  day,
});

const trendOf = (kg: number): Trend => ({ day, kg, slopePerWeek: 0 });

describe("isOutlier", () => {
  it.each([
    [98.7, 97.7, true],
    [98.61, 97.7, true],
    [98.6004, 97.7, true],
    [98.6, 97.7, false],
    [97.7, 97.7, false],
    [96.8, 97.7, false],
    [96.79, 97.7, true],
    [96.7, 97.7, true],
  ])("calls %d kg on a trend of %d kg an outlier: %s", (kg, trend, outlier) => {
    expect(isOutlier(measured(kg), trendOf(trend))).toBe(outlier);
  });
});
