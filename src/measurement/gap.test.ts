import { describe, expect, it } from "vitest";
import { findGaps } from "./gap";
import { countingMeasurements } from "./measurement";

/** Counting measurements on the given days, each at 7:00 in Berlin. */
const onDays = (...days: string[]) =>
  countingMeasurements(
    days.map((day) => ({ time: new Date(`${day}T05:00:00Z`), kg: 98 })),
  );

describe("findGaps", () => {
  it("finds a gap with its length, 22.9. to 1.10. being 9 days", () => {
    expect(findGaps(onDays("2026-09-21", "2026-09-22", "2026-10-01"))).toEqual([
      { lastDayBefore: "2026-09-22", firstDayAfter: "2026-10-01", days: 9 },
    ]);
  });

  it("finds no gap between days 3 apart, the 1st and the 4th", () => {
    expect(findGaps(onDays("2026-10-01", "2026-10-04"))).toEqual([]);
  });

  it("finds a gap of 4 days between the 1st and the 5th", () => {
    expect(findGaps(onDays("2026-10-01", "2026-10-05"))).toEqual([
      { lastDayBefore: "2026-10-01", firstDayAfter: "2026-10-05", days: 4 },
    ]);
  });

  it("finds every gap, in order", () => {
    expect(
      findGaps(onDays("2026-07-01", "2026-07-10", "2026-07-11", "2026-08-01")),
    ).toEqual([
      { lastDayBefore: "2026-07-01", firstDayAfter: "2026-07-10", days: 9 },
      { lastDayBefore: "2026-07-11", firstDayAfter: "2026-08-01", days: 21 },
    ]);
  });

  it("counts calendar days across the night clocks go back", () => {
    expect(findGaps(onDays("2026-10-24", "2026-10-28"))).toEqual([
      { lastDayBefore: "2026-10-24", firstDayAfter: "2026-10-28", days: 4 },
    ]);
  });

  it("finds no gap without measurements or with only one", () => {
    expect(findGaps([])).toEqual([]);
    expect(findGaps(onDays("2026-10-17"))).toEqual([]);
  });

  it("finds no gap between days that follow one another", () => {
    expect(findGaps(onDays("2026-10-15", "2026-10-16", "2026-10-17"))).toEqual(
      [],
    );
  });
});
