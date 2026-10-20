import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  formatCalendarDay,
  formatDay,
  formatKg,
  formatMonth,
  formatPace,
  formatPaceDeviation,
  formatTime,
  isPaceShownAsZero,
} from "./format";

describe("formatKg", () => {
  it.each([
    [99.7, "99,7"],
    [98.599, "98,6"],
    [100, "100,0"],
    [99.95, "100,0"],
    [64.04, "64,0"],
  ])("writes %d kg as %s, with a decimal comma and one decimal", (kg, text) => {
    expect(formatKg(kg)).toBe(text);
  });
});

describe("formatPace", () => {
  it.each([
    [-0.42, "−0,42"],
    [0.1, "+0,10"],
    [-1.5, "−1,50"],
    [0, "±0,00"],
  ])(
    "writes a pace of %d kg per week as %s, with its sign and two decimals",
    (kgPerWeek, text) => {
      expect(formatPace(kgPerWeek)).toBe(text);
    },
  );
});

describe("isPaceShownAsZero", () => {
  it.each([
    [0, true],
    [0.0049, true],
    [-0.0049, true],
    [0.005, false],
    [-0.005, false],
  ])("says of a pace of %d kg per week %s", (kgPerWeek, zero) => {
    expect(isPaceShownAsZero(kgPerWeek)).toBe(zero);
  });
});

describe("formatPaceDeviation", () => {
  it.each([
    [0.291, "0,29"],
    [0.5, "0,50"],
    [1.234, "1,23"],
  ])(
    "writes a standard deviation of %d kg per week as %s, unsigned, with two decimals",
    (kgPerWeek, text) => {
      expect(formatPaceDeviation(kgPerWeek)).toBe(text);
    },
  );
});

describe("formatDay", () => {
  it("writes the day and month without leading zeros", () => {
    expect(formatDay(new Date("2026-08-05T05:00:00Z"))).toBe("5.8.");
  });

  it("writes the Berlin day, which after 22:00 UTC in summer is the next", () => {
    expect(formatDay(new Date("2026-10-16T22:30:00Z"))).toBe("17.10.");
  });

  it("writes the Berlin day in winter, an hour ahead of UTC", () => {
    expect(formatDay(new Date("2026-12-31T23:30:00Z"))).toBe("1.1.");
  });
});

describe("formatCalendarDay", () => {
  it.each([
    ["2026-08-05", "5.8."],
    ["2026-10-17", "17.10."],
    ["2026-01-01", "1.1."],
    ["2026-03-29", "29.3."],
    ["2026-10-25", "25.10."],
  ])("writes %s as %s, without the year", (day, text) => {
    // Safe: valid `YYYY-MM-DD`s.
    expect(formatCalendarDay(day as CalendarDay)).toBe(text);
  });
});

describe("formatMonth", () => {
  it.each([
    ["2026-01-15", "Jan"],
    ["2026-03-01", "Mär"],
    ["2026-06-30", "Jun"],
    ["2026-09-15", "Sep"],
    ["2026-12-31", "Dez"],
  ])("writes the month of %s short: %s", (day, text) => {
    // Safe: valid `YYYY-MM-DD`s.
    expect(formatMonth(day as CalendarDay)).toBe(text);
  });
});

describe("formatTime", () => {
  it("writes the Berlin time of day, the hour without a leading zero", () => {
    expect(formatTime(new Date("2026-10-17T05:12:00Z"))).toBe("7:12");
  });

  it("writes the time after midnight as 0 hours", () => {
    expect(formatTime(new Date("2026-10-16T22:05:00Z"))).toBe("0:05");
  });

  it("follows Berlin across the switch to winter time", () => {
    expect(formatTime(new Date("2026-10-25T06:00:00Z"))).toBe("7:00");
  });
});
