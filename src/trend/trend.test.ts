import { describe, expect, it } from "vitest";
import { countingMeasurements } from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { trends } from "./trend";

/** Counting measurements, one per `[day, kg]`, each at 05:00 UTC, early morning in Berlin. */
const measured = (...days: [string, number][]) =>
  countingMeasurements(
    days.map(([day, kg]) => ({ time: new Date(`${day}T05:00:00Z`), kg })),
  );

describe("trends", () => {
  it("follows a straight line: its value on the day", () => {
    const line = measured(
      ["2026-10-01", 99.0],
      ["2026-10-02", 98.9],
      ["2026-10-03", 98.8],
      ["2026-10-04", 98.7],
      ["2026-10-05", 98.6],
    );

    const trend = trends(line).at(-1);

    expect(trend?.day).toBe("2026-10-05");
    expect(trend?.kg).toBeCloseTo(98.6, 10);
  });

  it("gives a day a trend only from its 5th counting measurement in 14 days on", () => {
    const days = measured(
      ["2026-10-01", 99.0],
      ["2026-10-02", 98.9],
      ["2026-10-03", 98.8],
      ["2026-10-04", 98.7],
      ["2026-10-05", 98.6],
      ["2026-10-06", 98.5],
    );

    expect(trends(days).map((trend) => trend.day)).toEqual([
      "2026-10-05",
      "2026-10-06",
    ]);
  });

  it("counts the measurements of the day and the 13 days before it, not the 14th", () => {
    const fourEarly: [string, number][] = [
      ["2026-10-01", 99.0],
      ["2026-10-02", 98.9],
      ["2026-10-03", 98.8],
      ["2026-10-04", 98.7],
    ];

    expect(trends(measured(...fourEarly, ["2026-10-14", 98.0]))).toHaveLength(
      1,
    );
    expect(trends(measured(...fourEarly, ["2026-10-15", 98.0]))).toEqual([]);
  });

  it("is not moved by one day far off the line", () => {
    const withOutlier = measured(
      ["2026-10-01", 99.0],
      ["2026-10-02", 98.9],
      ["2026-10-03", 101.8],
      ["2026-10-04", 98.7],
      ["2026-10-05", 98.6],
      ["2026-10-06", 98.5],
    );

    const trend = trends(withOutlier).at(-1);

    expect(trend?.kg).toBeCloseTo(98.5, 10);
  });

  it("counts calendar days, not the hours between measurements", () => {
    const laterEachDay = countingMeasurements(
      [
        ["2026-10-01T04:00:00Z", 99.0],
        ["2026-10-02T05:30:00Z", 98.9],
        ["2026-10-03T07:00:00Z", 98.8],
        ["2026-10-04T08:30:00Z", 98.7],
        ["2026-10-05T10:00:00Z", 98.6],
      ].map(([time, kg]) => ({ time: new Date(time), kg: Number(kg) })),
    );

    expect(trends(laterEachDay)[0].kg).toBeCloseTo(98.6, 10);
  });

  it("ends the fortnight at a calendar day, whatever the hour", () => {
    const fourEarly = countingMeasurements(
      [
        ["2026-10-01T09:00:00Z", 99.0],
        ["2026-10-02T09:00:00Z", 98.9],
        ["2026-10-03T09:00:00Z", 98.8],
        ["2026-10-04T09:00:00Z", 98.7],
        ["2026-10-15T04:00:00Z", 98.0],
      ].map(([time, kg]) => ({ time: new Date(time), kg: Number(kg) })),
    );

    expect(trends(fourEarly)).toEqual([]);
  });

  it("counts calendar days across the night clocks go back", () => {
    const line = measured(
      ["2026-10-22", 99.0],
      ["2026-10-23", 98.9],
      ["2026-10-24", 98.8],
      ["2026-10-25", 98.7],
      ["2026-10-26", 98.6],
    );

    expect(trends(line).at(-1)?.kg).toBeCloseTo(98.6, 10);
  });

  it("computes the real history as the specimen does: 97.75 kg on 17.10.", () => {
    const history = trends(countingMeasurements(weightHistory()));

    expect(history.map((trend) => trend.day)).not.toContain("2026-07-04");
    expect(history[0].day).toBe("2026-07-05");
    expect(history.at(-1)?.day).toBe("2026-10-17");
    expect(history.at(-1)?.kg).toBeCloseTo(97.75);
  });

  it("uses only the first measurement of a day; a later one changes nothing", () => {
    const history = weightHistory();
    const laterTheSameDay = {
      time: new Date("2026-10-17T18:00:00Z"),
      kg: 104.0,
    };

    expect(trends(countingMeasurements([...history, laterTheSameDay]))).toEqual(
      trends(countingMeasurements(history)),
    );
  });

  it("gives no trend without measurements", () => {
    expect(trends([])).toEqual([]);
  });
});
