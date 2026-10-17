import { describe, expect, it } from "vitest";
import { countingMeasurements } from "./measurement";

const at = (time: string, kg: number) => ({ time: new Date(time), kg });

/** The days and weights of the counting measurements among `measurements`. */
const counted = (...measurements: ReturnType<typeof at>[]) =>
  countingMeasurements(measurements).map(({ day, kg }) => [day, kg]);

describe("countingMeasurements", () => {
  it("counts the first measurement of a day, not the later ones", () => {
    expect(
      countingMeasurements([
        at("2026-10-17T05:30:00Z", 98.6),
        at("2026-10-17T18:00:00Z", 99.4),
      ]),
    ).toEqual([{ ...at("2026-10-17T05:30:00Z", 98.6), day: "2026-10-17" }]);
  });

  it("is empty without measurements", () => {
    expect(countingMeasurements([])).toEqual([]);
  });

  it("counts the earliest measurement of a day whatever order they come in", () => {
    expect(
      counted(
        at("2026-10-17T18:00:00Z", 99.4),
        at("2026-10-17T05:30:00Z", 98.6),
      ),
    ).toEqual([["2026-10-17", 98.6]]);
  });

  it("counts one measurement for each day, ordered by day", () => {
    expect(
      counted(
        at("2026-10-17T05:30:00Z", 98.6),
        at("2026-10-15T06:00:00Z", 99.0),
        at("2026-10-16T19:00:00Z", 99.9),
        at("2026-10-15T20:00:00Z", 99.5),
        at("2026-10-16T05:00:00Z", 98.8),
      ),
    ).toEqual([
      ["2026-10-15", 99.0],
      ["2026-10-16", 98.8],
      ["2026-10-17", 98.6],
    ]);
  });

  it("puts a measurement shortly after midnight in Berlin on the new day", () => {
    expect(
      counted(
        at("2026-10-16T21:59:00Z", 99.0), // 23:59 summer time on the 16th
        at("2026-10-16T22:01:00Z", 98.0), // 00:01 summer time on the 17th
        at("2026-10-17T05:00:00Z", 98.5),
      ),
    ).toEqual([
      ["2026-10-16", 99.0],
      ["2026-10-17", 98.0],
    ]);
  });

  it("puts a measurement shortly before midnight in Berlin on the old day", () => {
    expect(
      counted(
        at("2026-12-01T22:59:00Z", 99.0), // 23:59 winter time on the 1st
        at("2026-12-02T06:00:00Z", 98.0),
      ),
    ).toEqual([
      ["2026-12-01", 99.0],
      ["2026-12-02", 98.0],
    ]);
  });

  it("counts by Berlin days across the night clocks go back", () => {
    expect(
      counted(
        at("2026-10-24T22:30:00Z", 98.0), // 00:30 summer time on the 25th
        at("2026-10-25T00:30:00Z", 99.0), // 01:30 winter time on the 25th
        at("2026-10-25T22:59:00Z", 97.0), // 23:59 winter time on the 25th
        at("2026-10-25T23:00:00Z", 96.0), // 00:00 winter time on the 26th
      ),
    ).toEqual([
      ["2026-10-25", 98.0],
      ["2026-10-26", 96.0],
    ]);
  });

  it("counts by Berlin days across the night clocks go forward", () => {
    expect(
      counted(
        at("2026-03-28T23:30:00Z", 98.0), // 00:30 winter time on the 29th
        at("2026-03-29T01:30:00Z", 99.0), // 03:30 summer time on the 29th
        at("2026-03-29T22:00:00Z", 97.0), // 00:00 summer time on the 30th
      ),
    ).toEqual([
      ["2026-03-29", 98.0],
      ["2026-03-30", 97.0],
    ]);
  });
});
