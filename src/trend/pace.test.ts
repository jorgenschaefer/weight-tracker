import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { countingMeasurements } from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { kcalPerDay, pace, paceBand } from "./pace";
import { type Trend, trends } from "./trend";

/** A trend of `kg` on `day`. */
const trend = (day: string, kg: number): Trend => ({
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg,
});

describe("pace", () => {
  it("is the change of the trend over 4 weeks, per week", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 97.0)];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)).toEqual({
      kgPerWeek: -0.5,
      band: "loss",
    });
  });

  it("is in the band its threshold from the scatter of its day puts it in", () => {
    // -0.24 kg per week; the threshold 1.25 × 0.20 × 1 kg = 0.25.
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 98.04)];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)).toEqual({
      kgPerWeek: -0.24,
      band: "stagnation",
    });
  });

  it("measures from the latest trend at least 28 days back, over the weeks between", () => {
    const history = [
      trend("2026-09-05", 110.0),
      trend("2026-09-12", 99.5),
      trend("2026-09-20", 90.0),
      trend("2026-10-17", 97.0),
    ];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)?.kgPerWeek).toBe(-0.5);
  });

  it("is rounded to hundredths, and its band is that of the rounded value", () => {
    // -0.2525 kg per week, rounded on the threshold of 0.25: „stagniert“.
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 97.99)];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)).toEqual({
      kgPerWeek: -0.25,
      band: "stagnation",
    });
  });

  it("is 0, not -0, where a loss too small to show rounds away", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-17", 98.99)];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)?.kgPerWeek).toBe(0);
  });

  it("computes the real history as the specimen does", () => {
    const history = trends(countingMeasurements(weightHistory()));

    expect(pace(history, "2026-10-17" as CalendarDay, 1)).toEqual({
      kgPerWeek: -0.42,
      band: "loss",
    });
    expect(pace(history, "2026-10-12" as CalendarDay, 1)).toEqual({
      kgPerWeek: -0.74,
      band: "loss",
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

    expect(pace(history, "2026-10-17" as CalendarDay, 1)?.kgPerWeek).toBe(
      -0.42,
    );
  });

  it("is none where the day has no trend", () => {
    const history = [trend("2026-09-19", 99.0), trend("2026-10-16", 97.0)];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)).toBeNull();
  });

  it("is none where no trend lies 28 days back", () => {
    const history = [trend("2026-09-20", 99.0), trend("2026-10-17", 97.0)];

    expect(pace(history, "2026-10-17" as CalendarDay, 1)).toBeNull();
    expect(pace([], "2026-10-17" as CalendarDay, 1)).toBeNull();
  });
});

describe("paceBand", () => {
  // The threshold at a scatter of 1 kg: 1.25 × 0.20 × 1 kg per week.
  it.each([
    [0.26, "gain"],
    [0.25, "stagnation"],
    [0, "stagnation"],
    [-0.25, "stagnation"],
    [-0.26, "loss"],
    [-1.4, "loss"],
  ])("puts %d kg per week at a scatter of 1 kg in %s", (kgPerWeek, band) => {
    expect(paceBand(kgPerWeek, 1)).toBe(band);
  });

  it("takes its threshold from the scatter", () => {
    // 1.25 × 0.20 × 0.4 kg = 0.1 kg per week.
    expect(paceBand(0.11, 0.4)).toBe("gain");
    expect(paceBand(-0.11, 0.4)).toBe("loss");
    expect(paceBand(0.11, 0.6)).toBe("stagnation");
  });
});

describe("kcalPerDay", () => {
  // 7700 kcal per kg, over the 7 days of a week, rounded down to tens.
  it.each([
    [-0.33, 360],
    [-0.35, 380],
    [0.35, 380],
    [-0.7, 770],
    [-4.1, 4510],
    [0.01, 10],
    [0, 0],
  ])("is %d kg per week as %d kcal a day", (kgPerWeek, kcal) => {
    expect(kcalPerDay(kgPerWeek)).toBe(kcal);
  });
});
