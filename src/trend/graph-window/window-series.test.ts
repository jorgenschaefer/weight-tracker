import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { countingMeasurements } from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { windowUpTo } from "./graph-window";
import { windowSeries } from "./window-series";

// Safe: a valid `YYYY-MM-DD`.
const october17 = "2026-10-17" as CalendarDay;

/** The window of „6 Wochen“ up to `today`. */
const sixWeeksUpTo = (today: CalendarDay) => windowUpTo("sixWeeks", today);

const realHistory = () => countingMeasurements(weightHistory());

describe("windowSeries", () => {
  it("holds the counting measurements of today and the 41 days before", () => {
    const days = windowSeries(
      realHistory(),
      sixWeeksUpTo(october17),
    ).measurements.map(({ measurement }) => measurement.day);

    expect(days[0]).toBe("2026-09-06");
    expect(days.at(-1)).toBe("2026-10-17");
    expect(days).toHaveLength(34);
  });

  it("holds the counting measurements of a window of whole months, from its first day on", () => {
    const series = windowSeries(
      realHistory(),
      windowUpTo("threeMonths", october17),
    );

    expect(series.measurements[0].measurement.day).toBe("2026-08-01");
    expect(series.trendLine[0][0].day).toBe("2026-08-01");
    expect(series.measurements.at(-1)?.measurement.day).toBe("2026-10-17");
  });

  it("leaves out what lies after today", () => {
    const series = windowSeries(
      realHistory(),
      sixWeeksUpTo("2026-10-12" as CalendarDay),
    );

    expect(series.measurements.at(-1)?.measurement.day).toBe("2026-10-12");
    expect(series.trendLine.at(-1)?.at(-1)?.day).toBe("2026-10-12");
  });

  it("marks the measurements with z over 2 or under −2 as outliers", () => {
    const outliers = windowSeries(realHistory(), sixWeeksUpTo(october17))
      .measurements.filter(({ outlier }) => outlier)
      .map(({ measurement }) => measurement.day);

    expect(outliers).toEqual([
      "2026-09-15",
      "2026-10-03",
      "2026-10-04",
      "2026-10-06",
      "2026-10-07",
      "2026-10-12",
    ]);
  });

  it("marks outliers from the second measurement on, the first never", () => {
    const fewDays = countingMeasurements(
      [99.0, 80.0].map((kg, i) => ({
        time: new Date(`2026-10-1${i}T05:00:00Z`),
        kg,
      })),
    );

    expect(
      windowSeries(fewDays, sixWeeksUpTo(october17)).measurements.map(
        ({ outlier }) => outlier,
      ),
    ).toEqual([false, true]);
  });

  it("draws the filter's trend of each day as a line, broken at the gap 22.9. to 1.10.", () => {
    const line = windowSeries(realHistory(), sixWeeksUpTo(october17)).trendLine;

    expect(line.map((piece) => piece.map((trend) => trend.day))).toEqual([
      days("2026-09-", 6, 22),
      days("2026-10-", 1, 17),
    ]);
    expect(line[1].at(-1)?.kg).toBeCloseTo(97.86);
    expect(line[1].at(-1)?.kgVariance).toBeCloseTo(0.29 ** 2, 2);
  });

  it("draws a day alone between two gaps as a piece of its own, and marks the last day an outlier", () => {
    // 4.10., 2 kg over the days before it.
    const afterGaps = countingMeasurements(
      (
        [
          ["2026-09-01", 99.0],
          ["2026-09-02", 99.0],
          ["2026-09-03", 99.0],
          ["2026-09-04", 99.0],
          ["2026-09-05", 99.0],
          ["2026-09-06", 99.0],
          ["2026-09-07", 99.0],
          ["2026-09-21", 98.0],
          ["2026-10-01", 97.0],
          ["2026-10-02", 97.0],
          ["2026-10-03", 97.0],
          ["2026-10-04", 99.0],
        ] as const
      ).map(([day, kg]) => ({ time: new Date(`${day}T05:00:00Z`), kg })),
    );

    const series = windowSeries(
      afterGaps,
      sixWeeksUpTo("2026-10-04" as CalendarDay),
    );

    expect(
      series.trendLine.map((piece) => piece.map((trend) => trend.day)),
    ).toEqual([days("2026-09-", 1, 7), ["2026-09-21"], days("2026-10-", 1, 4)]);
    expect(series.measurements.at(-1)?.outlier).toBe(true);
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

    expect(windowSeries(withLater, sixWeeksUpTo(october17))).toEqual(
      windowSeries(realHistory(), sixWeeksUpTo(october17)),
    );
  });

  it("is empty without measurements", () => {
    expect(windowSeries([], sixWeeksUpTo(october17))).toEqual({
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
