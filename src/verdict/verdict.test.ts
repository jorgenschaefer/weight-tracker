import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";
import type { Trend } from "@/trend/trend";
import { trendVerdict } from "./verdict";

/** A trend on `day` with `slopePerWeek`; its weight plays no part in the verdict. */
const trend = (day: string, slopePerWeek: number): Trend => ({
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  day: day as CalendarDay,
  kg: 98.0,
  slopePerWeek,
});

describe("trendVerdict", () => {
  it("is „Nimmt ab“ while the trend falls faster than 0.2 kg per week", () => {
    const history = [trend("2026-10-16", 0.1), trend("2026-10-17", -0.21)];

    expect(trendVerdict(history, "2026-10-17" as CalendarDay)).toEqual({
      kind: "losing",
    });
  });

  it("is no decrease since N days, from the last day with a falling trend", () => {
    const history = [
      trend("2026-10-10", -0.5),
      trend("2026-10-11", -0.1),
      trend("2026-10-17", 0.1),
    ];

    expect(trendVerdict(history, "2026-10-17" as CalendarDay)).toEqual({
      kind: "noDecrease",
      days: 7,
      atLeast: false,
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

      expect(trendVerdict(history, lastDay as CalendarDay).kind).toBe(kind);
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

    expect(trendVerdict(history, lastDay)).toMatchObject({ days, level });
  });

  it("does not count a trend falling at exactly 0.2 kg per week as falling", () => {
    const history = [trend("2026-10-10", -0.21), trend("2026-10-17", -0.2)];

    expect(trendVerdict(history, "2026-10-17" as CalendarDay)).toMatchObject({
      kind: "noDecrease",
      days: 7,
    });
  });

  it("does not count 0.2 kg in 7 days as falling, though the slope comes out a hair below -0.2", () => {
    const slopeOfTwoTenthsInAWeek = ((98.6 - 98.8) / 7) * 7;
    const history = [
      trend("2026-10-10", -0.21),
      trend("2026-10-17", slopeOfTwoTenthsInAWeek),
    ];

    expect(slopeOfTwoTenthsInAWeek).toBeLessThan(-0.2);
    expect(trendVerdict(history, "2026-10-17" as CalendarDay)).toMatchObject({
      kind: "noDecrease",
      days: 7,
    });
  });

  it("is no decrease since at least N days, from the first day with a trend, where no trend ever fell", () => {
    const history = [
      trend("2026-10-05", -0.2),
      trend("2026-10-09", 0.3),
      trend("2026-10-17", 0.1),
    ];

    expect(trendVerdict(history, "2026-10-17" as CalendarDay)).toEqual({
      kind: "noDecrease",
      days: 12,
      atLeast: true,
      level: 2,
    });
  });

  it("stays „Nimmt ab“ for the first 2 days with a trend, where no trend ever fell", () => {
    const history = [trend("2026-10-15", 0.3), trend("2026-10-17", 0.3)];

    expect(trendVerdict(history, "2026-10-17" as CalendarDay)).toEqual({
      kind: "losing",
    });
  });
});

/** The day `days` days after `day`. */
function calendarDayAfter(day: string, days: number): CalendarDay {
  return calendarDayBefore(day as CalendarDay, -days);
}
