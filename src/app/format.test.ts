import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import type { Span } from "@/trend/graph-window/graph-window";
import {
  formatCalendarDay,
  formatDay,
  formatKg,
  formatMonth,
  formatPace,
  formatPaceDeviation,
  formatRange,
  formatSpan,
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

describe("formatSpan", () => {
  it.each([
    ["sixWeeks", "6 Wochen"],
    ["threeMonths", "3 Monate"],
    ["oneYear", "1 Jahr"],
  ] as const)("names %s „%s“", (span, name) => {
    expect(formatSpan(span)).toBe(name);
  });
});

describe("formatRange", () => {
  // Safe: valid `YYYY-MM-DD`s.
  const range = (span: Span, firstDay: string, lastDay: string) =>
    formatRange(
      span,
      { firstDay: firstDay as CalendarDay, lastDay: lastDay as CalendarDay },
      "2026-10-20" as CalendarDay,
    );

  it("is „Bis heute“ for „6 Wochen“ up to today", () => {
    expect(range("sixWeeks", "2026-09-09", "2026-10-20")).toBe("Bis heute");
  });

  it.each([
    ["2026-07-29", "2026-09-08", "29.7.26 – 8.9.26"],
    ["2026-09-08", "2026-10-19", "8.9.26 – 19.10.26"],
    ["2025-11-30", "2026-01-10", "30.11.25 – 10.1.26"],
  ])(
    "is the first and the last day with a two-digit year for „6 Wochen“ from %s to %s: %s",
    (firstDay, lastDay, text) => {
      expect(range("sixWeeks", firstDay, lastDay)).toBe(text);
    },
  );

  it.each([
    ["2026-08-01", "2026-10-31", "Aug – Okt 2026"],
    ["2026-05-01", "2026-07-31", "Mai – Jul 2026"],
    ["2025-11-01", "2026-01-31", "Nov 2025 – Jan 2026"],
  ])(
    "is the first and the last month for „3 Monate“ from %s to %s: %s",
    (firstDay, lastDay, text) => {
      expect(range("threeMonths", firstDay, lastDay)).toBe(text);
    },
  );

  it.each([
    ["2026-01-01", "2026-12-31", "2026"],
    ["2025-01-01", "2025-12-31", "2025"],
  ])(
    "is the year for „1 Jahr“ from %s to %s: %s",
    (firstDay, lastDay, text) => {
      expect(range("oneYear", firstDay, lastDay)).toBe(text);
    },
  );
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
