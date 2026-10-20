import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { windowUpTo } from "./graph-window";

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
