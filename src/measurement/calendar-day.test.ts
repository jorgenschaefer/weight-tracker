import { describe, expect, it } from "vitest";
import {
  berlinDay,
  type CalendarDay,
  calendarDayAfter,
  calendarDayBefore,
  dayOfMonth,
  daysBetween,
  yearAndMonth,
} from "./calendar-day";

describe("berlinDay", () => {
  it.each([
    [
      "shortly before midnight UTC, already the next day",
      "2026-10-16T22:30:00Z",
      "2026-10-17",
    ],
    ["at midnight in summer time", "2026-07-14T22:00:00Z", "2026-07-15"],
    [
      "a second before midnight in summer time",
      "2026-07-14T21:59:59Z",
      "2026-07-14",
    ],
    ["at midnight in winter time", "2026-12-01T23:00:00Z", "2026-12-02"],
    [
      "a second before midnight in winter time",
      "2026-12-01T22:59:59Z",
      "2026-12-01",
    ],
    [
      "on the night clocks go forward, before the switch",
      "2026-03-29T00:59:59Z",
      "2026-03-29",
    ],
    [
      "on the night clocks go forward, the last second of the day",
      "2026-03-29T21:59:59Z",
      "2026-03-29",
    ],
    [
      "on the night clocks go back, in the repeated hour",
      "2026-10-25T00:30:00Z",
      "2026-10-25",
    ],
    [
      "on the night clocks go back, the last second of the day",
      "2026-10-25T22:59:59Z",
      "2026-10-25",
    ],
    [
      "on the night clocks go back, the first second of the next day",
      "2026-10-25T23:00:00Z",
      "2026-10-26",
    ],
    ["at midnight on new year", "2026-12-31T23:00:00Z", "2027-01-01"],
  ])("is the date in Berlin %s", (_, instant, day) => {
    expect(berlinDay(new Date(instant))).toBe(day);
  });
});

describe("daysBetween", () => {
  const day = (instant: string) => berlinDay(new Date(instant));

  it.each([
    ["the same day", "2026-10-17T05:00:00Z", "2026-10-17T20:00:00Z", 0],
    ["consecutive days", "2026-10-16T05:00:00Z", "2026-10-17T05:00:00Z", 1],
    ["across a month end", "2026-09-22T05:00:00Z", "2026-10-01T05:00:00Z", 9],
    [
      "across the night clocks go back",
      "2026-10-24T05:00:00Z",
      "2026-10-26T05:00:00Z",
      2,
    ],
    [
      "across the night clocks go forward",
      "2026-03-28T05:00:00Z",
      "2026-03-30T05:00:00Z",
      2,
    ],
    ["across a year end", "2026-12-31T05:00:00Z", "2027-01-01T05:00:00Z", 1],
    ["backwards, negative", "2026-10-17T05:00:00Z", "2026-10-14T05:00:00Z", -3],
  ])("counts the days from one day to another, %s", (_, from, to, days) => {
    expect(daysBetween(day(from), day(to))).toBe(days);
  });
});

describe("calendarDayBefore", () => {
  it.each([
    ["the day itself", "2026-10-17", 0, "2026-10-17"],
    ["the day before", "2026-10-17", 1, "2026-10-16"],
    ["across a month start", "2026-10-01", 9, "2026-09-22"],
    ["across the night clocks go back", "2026-10-26", 2, "2026-10-24"],
    ["across the night clocks go forward", "2026-03-30", 2, "2026-03-28"],
    ["across a year start", "2027-01-01", 1, "2026-12-31"],
  ])("goes back from one day to another, %s", (_, day, days, earlier) => {
    // Safe: valid `YYYY-MM-DD`s.
    expect(calendarDayBefore(day as CalendarDay, days)).toBe(earlier);
  });
});

describe("calendarDayAfter", () => {
  it.each([
    ["the day itself", "2026-10-17", 0, "2026-10-17"],
    ["the day after", "2026-10-17", 1, "2026-10-18"],
    ["six weeks later, across a month end", "2026-09-08", 42, "2026-10-20"],
    ["across the night clocks go back", "2026-10-24", 2, "2026-10-26"],
    ["across a year end", "2026-12-31", 1, "2027-01-01"],
  ])("goes on from one day to another, %s", (_, day, days, later) => {
    // Safe: valid `YYYY-MM-DD`s.
    expect(calendarDayAfter(day as CalendarDay, days)).toBe(later);
  });
});

describe("yearAndMonth", () => {
  it.each([
    ["2026-10-20", 2026, 9],
    ["2026-01-01", 2026, 0],
    ["2015-12-31", 2015, 11],
  ])("reads %s as its year and month, January 0", (day, year, month) => {
    // Safe: valid `YYYY-MM-DD`s.
    expect(yearAndMonth(day as CalendarDay)).toEqual([year, month]);
  });
});

describe("dayOfMonth", () => {
  it.each([
    ["a day of a month", 2026, 9, 20, "2026-10-20"],
    ["the first of January", 2026, 0, 1, "2026-01-01"],
    [
      "the last of a short month, as date 0 of the next",
      2026,
      2,
      0,
      "2026-02-28",
    ],
    ["the last of February in a leap year", 2028, 2, 0, "2028-02-29"],
    ["a month past December, in the next year", 2026, 13, 15, "2027-02-15"],
    ["a month before January, in the year before", 2026, -2, 1, "2025-11-01"],
  ])("is %s", (_, year, month, date, day) => {
    expect(dayOfMonth(year, month, date)).toBe(day);
  });
});
