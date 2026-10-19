import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { countingMeasurements } from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { sixWeekSeries } from "./six-week-series";

// Safe: a valid `YYYY-MM-DD`.
const october17 = "2026-10-17" as CalendarDay;

const realHistory = () => countingMeasurements(weightHistory());

describe("sixWeekSeries", () => {
  it("holds the counting measurements of today and the 41 days before", () => {
    const days = sixWeekSeries(realHistory(), october17).measurements.map(
      ({ measurement }) => measurement.day,
    );

    expect(days[0]).toBe("2026-09-06");
    expect(days.at(-1)).toBe("2026-10-17");
    expect(days).toHaveLength(34);
  });

  it("leaves out what lies after today", () => {
    const series = sixWeekSeries(realHistory(), "2026-10-12" as CalendarDay);

    expect(series.measurements.at(-1)?.measurement.day).toBe("2026-10-12");
    expect(series.trendLine.at(-1)?.at(-1)?.day).toBe("2026-10-12");
  });

  it("marks the measurements beyond the threshold of their own day's scatter from their day's trend, above or below", () => {
    const outliers = sixWeekSeries(realHistory(), october17)
      .measurements.filter(({ outlier }) => outlier)
      .map(({ measurement }) => measurement.day);

    expect(outliers).toEqual([
      "2026-09-12",
      "2026-09-15",
      "2026-09-18",
      "2026-09-20",
      "2026-10-08",
      "2026-10-09",
      "2026-10-12",
      "2026-10-13",
    ]);
  });

  it("marks no measurement whose day has no trend", () => {
    const fewDays = countingMeasurements(
      [99.0, 80.0, 99.0, 80.0].map((kg, i) => ({
        time: new Date(`2026-10-1${i}T05:00:00Z`),
        kg,
      })),
    );

    expect(
      sixWeekSeries(fewDays, october17).measurements.map(
        ({ outlier }) => outlier,
      ),
    ).toEqual([false, false, false, false]);
  });

  it("draws the trend of each day as a line, broken at the gap 22.9. to 1.10.", () => {
    const line = sixWeekSeries(realHistory(), october17).trendLine;

    expect(line.map((piece) => piece.map((trend) => trend.day))).toEqual([
      days("2026-09-", 6, 22),
      days("2026-10-", 1, 17),
    ]);
    expect(line[1].at(-1)?.kg).toBeCloseTo(97.75);
  });

  it("uses only the first measurement of a day; a later one changes nothing", () => {
    const laterTheSameDay = {
      time: new Date("2026-10-12T18:00:00Z"),
      kg: 97.1,
    };
    const withLater = countingMeasurements([
      ...weightHistory(),
      laterTheSameDay,
    ]);

    expect(sixWeekSeries(withLater, october17)).toEqual(
      sixWeekSeries(realHistory(), october17),
    );
  });

  it("is empty without measurements", () => {
    expect(sixWeekSeries([], october17)).toEqual({
      measurements: [],
      trendLine: [],
    });
  });
});

/** The days `first` to `last` of the month starting `month`, both included. */
function days(month: string, first: number, last: number): string[] {
  return Array.from(
    { length: last - first + 1 },
    (_, i) => `${month}${String(first + i).padStart(2, "0")}`,
  );
}
