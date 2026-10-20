import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import { isOutlier } from "./outlier";
import type { Trend } from "./theil-sen";

// Safe: a valid `YYYY-MM-DD`.
const day = "2026-10-12" as CalendarDay;

const measured = (kg: number): CountingMeasurement => ({
  time: new Date("2026-10-12T05:00:00Z"),
  kg,
  day,
});

const trendOf = (kg: number): Trend => ({ day, kg });

describe("isOutlier", () => {
  it.each([
    // A scatter of 0.8 kg: a threshold of 1.0 kg.
    [98.8, 97.7, 0.8, true],
    [98.7004, 97.7, 0.8, true],
    [98.7, 97.7, 0.8, false],
    [97.7, 97.7, 0.8, false],
    [96.7, 97.7, 0.8, false],
    [96.6996, 97.7, 0.8, true],
    [96.6, 97.7, 0.8, true],
    // A scatter of 0.4 kg: a threshold of 0.5 kg.
    [98.3, 97.7, 0.4, true],
    [97.1, 97.7, 0.4, true],
    [98.2, 97.7, 0.4, false],
  ])(
    "calls %d kg on a trend of %d kg with a scatter of %d kg an outlier: %s",
    (kg, trend, scatterKg, outlier) => {
      expect(isOutlier(measured(kg), trendOf(trend), scatterKg)).toBe(outlier);
    },
  );
});
