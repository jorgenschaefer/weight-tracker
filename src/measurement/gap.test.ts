import { describe, expect, it } from "vitest";
import { findGaps } from "./gap";
import { countingMeasurements } from "./measurement";

/** Counting measurements on the given days, each at 7:00 in Berlin. */
const onDays = (...days: string[]) =>
  countingMeasurements(
    days.map((day) => ({ time: new Date(`${day}T05:00:00Z`), kg: 98 })),
  );

describe("findGaps", () => {
  it("finds a gap, 22.9. to 1.10.", () => {
    expect(findGaps(onDays("2026-09-21", "2026-09-22", "2026-10-01"))).toEqual([
      { lastDayBefore: "2026-09-22", firstDayAfter: "2026-10-01" },
    ]);
  });

  it("finds no gap between days 3 apart, the 1st and the 4th", () => {
    expect(findGaps(onDays("2026-10-01", "2026-10-04"))).toEqual([]);
  });

  it("finds a gap between days 4 apart, the 1st and the 5th", () => {
    expect(findGaps(onDays("2026-10-01", "2026-10-05"))).toEqual([
      { lastDayBefore: "2026-10-01", firstDayAfter: "2026-10-05" },
    ]);
  });

  it("finds every gap, in order", () => {
    expect(
      findGaps(onDays("2026-07-01", "2026-07-10", "2026-07-11", "2026-08-01")),
    ).toEqual([
      { lastDayBefore: "2026-07-01", firstDayAfter: "2026-07-10" },
      { lastDayBefore: "2026-07-11", firstDayAfter: "2026-08-01" },
    ]);
  });

  it("counts calendar days across the night clocks go back", () => {
    expect(findGaps(onDays("2026-10-24", "2026-10-28"))).toEqual([
      { lastDayBefore: "2026-10-24", firstDayAfter: "2026-10-28" },
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
