import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { fourDayPace } from "./four-day-pace";
import type { Trend } from "./trend";

/** A trend of `kg` on `day`; the slope plays no part in the 4-day pace. */
const trend = (day: string, kg: number): Trend => ({
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg,
  slopePerWeek: 0,
});

const day = (day: string) => day as CalendarDay;

describe("fourDayPace", () => {
  it("is the change of the trend against 4 days before, per week", () => {
    const history = [trend("2026-10-13", 98.0), trend("2026-10-17", 98.4)];

    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-01")),
    ).toBeCloseTo(0.7);
  });

  it("compares with the last trend 4 to 7 days back", () => {
    const history = [
      trend("2026-10-10", 97.0),
      trend("2026-10-12", 98.0),
      trend("2026-10-14", 99.0),
      trend("2026-10-17", 98.5),
    ];

    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-01")),
    ).toBeCloseTo(0.7);
  });

  it("compares with a trend 7 days back", () => {
    const history = [trend("2026-10-10", 98.0), trend("2026-10-17", 98.5)];

    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-01")),
    ).toBeCloseTo(0.5);
  });

  it("is none where no trend lies 4 to 7 days back", () => {
    const history = [
      trend("2026-10-09", 98.0),
      trend("2026-10-14", 98.2),
      trend("2026-10-17", 98.4),
    ];

    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-01")),
    ).toBeNull();
  });

  it("is none where the day has no trend", () => {
    const history = [trend("2026-10-12", 98.0), trend("2026-10-16", 98.4)];

    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-01")),
    ).toBeNull();
  });

  it("compares only with trends from the first comparable day on", () => {
    const history = [
      trend("2026-10-12", 98.0),
      trend("2026-10-13", 98.0),
      trend("2026-10-17", 98.4),
    ];

    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-13")),
    ).toBeCloseTo(0.7);
    expect(
      fourDayPace(history, day("2026-10-17"), day("2026-10-14")),
    ).toBeNull();
  });
});
