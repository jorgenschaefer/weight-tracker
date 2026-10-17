import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { countingMeasurements } from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { pace, paceBand } from "./pace";
import { type Trend, trends } from "./trend";

/** A trend of `kg` on `day`; the slope plays no part in the pace. */
const trend = (day: string, kg: number): Trend => ({
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg,
  slopePerWeek: 0,
});

describe("pace", () => {
  it("is the change of the trend over 4 weeks, per week", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 97.0)];

    expect(pace(history, "2026-10-17" as CalendarDay)).toEqual({
      kgPerWeek: -0.5,
      band: "slowLoss",
    });
  });
  it("measures from the latest trend at least 28 days back, over the weeks between", () => {
    const history = [
      trend("2026-09-05", 110.0),
      trend("2026-09-12", 99.5),
      trend("2026-09-20", 90.0),
      trend("2026-10-17", 97.0),
    ];

    expect(pace(history, "2026-10-17" as CalendarDay)?.kgPerWeek).toBe(-0.5);
  });

  it("is rounded to hundredths, and its band is that of the rounded value", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 96.99)];

    expect(pace(history, "2026-10-17" as CalendarDay)).toEqual({
      kgPerWeek: -0.5,
      band: "slowLoss",
    });
  });

  it("is 0, not -0, where a loss too small to show rounds away", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 98.99)];

    expect(pace(history, "2026-10-17" as CalendarDay)?.kgPerWeek).toBe(0);
  });

  it("computes the real history as the specimen does", () => {
    const history = trends(countingMeasurements(weightHistory()));

    expect(pace(history, "2026-10-17" as CalendarDay)).toEqual({
      kgPerWeek: -0.42,
      band: "slowLoss",
    });
    expect(pace(history, "2026-10-12" as CalendarDay)).toEqual({
      kgPerWeek: -0.74,
      band: "moderateLoss",
    });
  });

  it("uses only the first measurement of a day; a later one changes nothing", () => {
    const laterTheSameDay = {
      time: new Date("2026-10-17T18:00:00Z"),
      kg: 90.0,
    };
    const history = trends(
      countingMeasurements([...weightHistory(), laterTheSameDay]),
    );

    expect(pace(history, "2026-10-17" as CalendarDay)?.kgPerWeek).toBe(-0.42);
  });

  it("is none where the day has no trend", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-16", 97.0)];

    expect(pace(history, "2026-10-17" as CalendarDay)).toBeNull();
  });

  it("is none where no trend lies 28 days back", () => {
    const history = [trend("2026-09-20", 99.0), trend("2026-10-17", 97.0)];

    expect(pace(history, "2026-10-17" as CalendarDay)).toBeNull();
    expect(pace([], "2026-10-17" as CalendarDay)).toBeNull();
  });
});

describe("paceBand", () => {
  it.each([
    [0.11, "gain"],
    [0.1, "maintained"],
    [0, "maintained"],
    [-0.1, "maintained"],
    [-0.11, "slowLoss"],
    [-0.5, "slowLoss"],
    [-0.51, "moderateLoss"],
    [-1.0, "moderateLoss"],
    [-1.01, "fastLoss"],
  ])("puts %d kg per week in %s", (kgPerWeek, band) => {
    expect(paceBand(kgPerWeek)).toBe(band);
  });
});
