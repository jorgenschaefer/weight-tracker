import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  earlierWindow,
  hasEarlierWindow,
  hasLaterWindow,
  laterWindow,
  windowOnSwitch,
  windowUpTo,
} from "./graph-window";

// Safe: valid `YYYY-MM-DD`s.
const day = (text: string) => text as CalendarDay;

describe("windowUpTo", () => {
  it("is the 42 days ending with today for „6 Wochen“", () => {
    expect(windowUpTo("sixWeeks", day("2026-10-20"))).toEqual({
      firstDay: "2026-09-09",
      lastDay: "2026-10-20",
    });
  });

  it("is this month and the two before for „3 Monate“, to the end of this month", () => {
    expect(windowUpTo("threeMonths", day("2026-10-20"))).toEqual({
      firstDay: "2026-08-01",
      lastDay: "2026-10-31",
    });
  });

  it.each([
    ["2026-01-15", "2025-11-01", "2026-01-31"],
    ["2026-02-01", "2025-12-01", "2026-02-28"],
    ["2028-02-29", "2027-12-01", "2028-02-29"],
    ["2026-12-31", "2026-10-01", "2026-12-31"],
  ])(
    "takes whole months for „3 Monate“ across a new year, February and month ends: on %s %s to %s",
    (today, firstDay, lastDay) => {
      expect(windowUpTo("threeMonths", day(today))).toEqual({
        firstDay,
        lastDay,
      });
    },
  );

  it.each([
    ["2026-10-20", "2026-01-01", "2026-12-31"],
    ["2026-01-01", "2026-01-01", "2026-12-31"],
    ["2028-12-31", "2028-01-01", "2028-12-31"],
  ])(
    "is the calendar year for „1 Jahr“: on %s %s to %s",
    (today, firstDay, lastDay) => {
      expect(windowUpTo("oneYear", day(today))).toEqual({ firstDay, lastDay });
    },
  );
});

describe("earlierWindow", () => {
  it.each([
    ["sixWeeks", "2026-09-09", "2026-10-20", "2026-07-29", "2026-09-08"],
    ["threeMonths", "2026-08-01", "2026-10-31", "2026-05-01", "2026-07-31"],
    ["threeMonths", "2026-01-01", "2026-03-31", "2025-10-01", "2025-12-31"],
    ["oneYear", "2026-01-01", "2026-12-31", "2025-01-01", "2025-12-31"],
  ] as const)(
    "is the whole %s before %s to %s: %s to %s",
    (span, firstDay, lastDay, earlierFirst, earlierLast) => {
      expect(
        earlierWindow(span, { firstDay: day(firstDay), lastDay: day(lastDay) }),
      ).toEqual({ firstDay: earlierFirst, lastDay: earlierLast });
    },
  );
});

describe("laterWindow", () => {
  it.each([
    ["sixWeeks", "2026-06-17", "2026-07-28", "2026-07-29", "2026-09-08"],
    ["sixWeeks", "2026-07-28", "2026-09-07", "2026-09-08", "2026-10-19"],
    ["threeMonths", "2026-02-01", "2026-04-30", "2026-05-01", "2026-07-31"],
    ["threeMonths", "2025-10-01", "2025-12-31", "2026-01-01", "2026-03-31"],
    ["threeMonths", "2025-11-01", "2026-01-31", "2026-02-01", "2026-04-30"],
    ["oneYear", "2024-01-01", "2024-12-31", "2025-01-01", "2025-12-31"],
  ] as const)(
    "is the whole %s after %s to %s, ending before today: %s to %s",
    (span, firstDay, lastDay, laterFirst, laterLast) => {
      expect(
        laterWindow(
          span,
          { firstDay: day(firstDay), lastDay: day(lastDay) },
          day("2026-10-20"),
        ),
      ).toEqual({ firstDay: laterFirst, lastDay: laterLast });
    },
  );

  it.each([
    ["sixWeeks", "2026-07-29", "2026-09-08"],
    ["sixWeeks", "2026-07-30", "2026-09-09"],
    ["threeMonths", "2026-05-01", "2026-07-31"],
    ["threeMonths", "2026-06-01", "2026-08-31"],
    ["oneYear", "2025-01-01", "2025-12-31"],
  ] as const)(
    "is the window up to today, `null`, where the whole %s after %s to %s would reach today",
    (span, firstDay, lastDay) => {
      expect(
        laterWindow(
          span,
          { firstDay: day(firstDay), lastDay: day(lastDay) },
          day("2026-10-20"),
        ),
      ).toBeNull();
    },
  );
});

describe("windowOnSwitch", () => {
  it.each([
    [
      "sixWeeks",
      "2026-07-29",
      "2026-09-08",
      "threeMonths",
      "2026-07-01",
      "2026-09-30",
    ],
    [
      "threeMonths",
      "2026-05-01",
      "2026-07-31",
      "sixWeeks",
      "2026-06-20",
      "2026-07-31",
    ],
    [
      "oneYear",
      "2025-01-01",
      "2025-12-31",
      "threeMonths",
      "2025-10-01",
      "2025-12-31",
    ],
    [
      "oneYear",
      "2025-01-01",
      "2025-12-31",
      "sixWeeks",
      "2025-11-20",
      "2025-12-31",
    ],
  ] as const)(
    "takes the last day of %s %s to %s, and on %s ends with it: %s to %s",
    (_, firstDay, lastDay, span, switchedFirst, switchedLast) => {
      expect(
        windowOnSwitch(
          span,
          { firstDay: day(firstDay), lastDay: day(lastDay) },
          day("2026-10-20"),
        ),
      ).toEqual({ firstDay: switchedFirst, lastDay: switchedLast });
    },
  );

  it.each([
    ["sixWeeks", "2026-07-29", "2026-09-08", "oneYear"],
    ["threeMonths", "2026-08-01", "2026-10-31", "sixWeeks"],
    ["oneYear", "2026-01-01", "2026-12-31", "threeMonths"],
    ["sixWeeks", "2026-09-09", "2026-10-20", "threeMonths"],
  ] as const)(
    "is the window up to today, `null`, where from %s %s to %s the window on %s reaches today",
    (_, firstDay, lastDay, span) => {
      expect(
        windowOnSwitch(
          span,
          { firstDay: day(firstDay), lastDay: day(lastDay) },
          day("2026-10-20"),
        ),
      ).toBeNull();
    },
  );
});

describe("hasEarlierWindow", () => {
  it.each([
    ["2026-07-02", true],
    ["2026-07-01", false],
    ["2026-06-30", false],
  ])(
    "for a window from %s, with the first counting measurement on 1.7., is %s",
    (firstDay, has) => {
      expect(
        hasEarlierWindow(
          { firstDay: day(firstDay), lastDay: day("2026-09-08") },
          day("2026-07-01"),
        ),
      ).toBe(has);
    },
  );
});

describe("hasLaterWindow", () => {
  it.each([
    ["2026-10-19", true],
    ["2026-10-20", false],
    ["2026-12-31", false],
  ])("for a window to %s, on 20.10., is %s", (lastDay, has) => {
    expect(
      hasLaterWindow(
        { firstDay: day("2026-01-01"), lastDay: day(lastDay) },
        day("2026-10-20"),
      ),
    ).toBe(has);
  });
});
