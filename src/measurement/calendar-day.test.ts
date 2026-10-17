import { describe, expect, it } from "vitest";
import {
  berlinDay,
  type CalendarDay,
  calendarDayBefore,
  daysBetween,
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
