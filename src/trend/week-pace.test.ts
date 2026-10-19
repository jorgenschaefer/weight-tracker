import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import type { Trend } from "./trend";
import { weekPace } from "./week-pace";

/** A trend of `kg` on `day`. */
const trend = (day: string, kg: number): Trend => ({
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg,
});

const day = (day: string) => day as CalendarDay;

describe("weekPace", () => {
  it("is the change of the trend against 7 days before, per week", () => {
    const history = [trend("2026-10-10", 98.0), trend("2026-10-17", 98.4)];

    expect(weekPace(history, day("2026-10-17"), day("2026-10-01"))).toBeCloseTo(
      0.4,
    );
  });

  it("compares with the last trend 7 to 10 days back", () => {
    const history = [
      trend("2026-10-07", 97.0),
      trend("2026-10-09", 98.0),
      trend("2026-10-11", 99.0),
      trend("2026-10-17", 98.5),
    ];

    expect(weekPace(history, day("2026-10-17"), day("2026-10-01"))).toBeCloseTo(
      0.4375,
    );
  });

  it("compares with a trend 10 days back", () => {
    const history = [trend("2026-10-07", 98.0), trend("2026-10-17", 98.5)];

    expect(weekPace(history, day("2026-10-17"), day("2026-10-01"))).toBeCloseTo(
      0.35,
    );
  });

  it("is none where no trend lies 7 to 10 days back", () => {
    const history = [
      trend("2026-10-06", 98.0),
      trend("2026-10-11", 98.2),
      trend("2026-10-17", 98.4),
    ];

    expect(weekPace(history, day("2026-10-17"), day("2026-10-01"))).toBeNull();
  });

  it("is none where the day has no trend", () => {
    const history = [trend("2026-10-09", 98.0), trend("2026-10-16", 98.4)];

    expect(weekPace(history, day("2026-10-17"), day("2026-10-01"))).toBeNull();
  });

  it("compares only with trends from the first comparable day on", () => {
    const history = [
      trend("2026-10-09", 98.0),
      trend("2026-10-10", 98.0),
      trend("2026-10-17", 98.4),
    ];

    expect(weekPace(history, day("2026-10-17"), day("2026-10-10"))).toBeCloseTo(
      0.4,
    );
    expect(weekPace(history, day("2026-10-17"), day("2026-10-11"))).toBeNull();
  });
});
