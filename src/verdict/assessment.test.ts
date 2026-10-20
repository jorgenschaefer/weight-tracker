import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
  type Measurement,
} from "@/measurement/measurement";
import { weightHistoryUntil } from "@/test/weight-history-fixture";
import { sixWeekSeries } from "@/trend/six-week-series";
import { trends } from "@/trend/trend";
import { assess } from "./assessment";

/** Counting measurements of [day, kg] pairs, each at 05:00 UTC. */
const countingFrom = (days: [string, number][]) =>
  countingMeasurements(
    days.map(([day, kg]) => ({ time: new Date(`${day}T05:00:00Z`), kg })),
  );

/** The counting measurements of the fixture and 18.10. to 20.10. up to `day`, as the page has them on that day. */
const historyUntil = (day: string, extra: Measurement[] = []) =>
  countingMeasurements(weightHistoryUntil(day, extra));

/** The assessment of the fixture and 18.10. to 20.10. on `day`, the day itself the last with a measurement. */
const assessOn = (day: string) => assess(historyUntil(day), day as CalendarDay);

describe("assess: the verdict on the fixture", () => {
  it.each([
    ["2026-07-13", "red", { kind: "gainingAgain" }],
    ["2026-07-14", "red", { kind: "gainingForDays", days: 2 }],
    ["2026-10-01", "red", { kind: "gainingForWeeks" }],
    ["2026-10-04", "yellow", { kind: "gainStopped" }],
    ["2026-10-06", "yellow", { kind: "probablyLosing" }],
    ["2026-10-13", "green", { kind: "losingForDays", days: 6 }],
    ["2026-10-20", "green", { kind: "losingForDays", days: 2 }],
  ])("on %s is %s, %o", (day, trafficLight, morningSentence) => {
    expect(assessOn(day).status).toMatchObject({
      kind: "verdict",
      trafficLight,
      morningSentence,
    });
  });

  it.each([
    ["2026-07-13", 0.08],
    ["2026-10-06", 0.64],
    ["2026-10-20", 0.9],
  ])("on %s carries the Sicherheit, about %s", (day, certainty) => {
    const { status } = assessOn(day);

    expect(status.kind === "verdict" && status.lossCertainty).toBeCloseTo(
      certainty,
      1,
    );
  });

  it("is a verdict from the first counting measurement on", () => {
    expect(
      assess(countingFrom([["2026-10-17", 95]]), "2026-10-17" as CalendarDay)
        .status,
    ).toMatchObject({
      kind: "verdict",
      trafficLight: "yellow",
      morningSentence: { kind: "open" },
    });
  });

  it("is that of the last day with a measurement up to 3 days after it, N counted up to that day", () => {
    expect(
      assess(historyUntil("2026-10-13"), "2026-10-16" as CalendarDay).status,
    ).toEqual(assessOn("2026-10-13").status);
  });
});

describe("assess: the figures", () => {
  it("carries „Gemessen“ and the trend of the last day with a measurement", () => {
    const counting = historyUntil("2026-10-17");

    const assessment = assess(counting, "2026-10-18" as CalendarDay);

    expect(assessment.measuredKg).toBe(98.6);
    expect(assessment.trend).toEqual(trends(counting).at(-1));
  });

  it("carries the 6-week series up to today", () => {
    const counting = historyUntil("2026-10-17");

    expect(assess(counting, "2026-10-18" as CalendarDay).sixWeekSeries).toEqual(
      sixWeekSeries(counting, "2026-10-18" as CalendarDay),
    );
  });

  it("uses only the first measurement of a day; a later one changes neither verdict nor „Gemessen“", () => {
    const later: Measurement[] = [
      { time: new Date("2026-08-30T18:00:00+02:00"), kg: 92.0 },
    ];

    expect(
      assess(historyUntil("2026-08-30", later), "2026-08-30" as CalendarDay),
    ).toEqual(assessOn("2026-08-30"));
  });
});

describe("assess: a single deviating value", () => {
  /**
   * A trend falling 1.4 kg per week, measured every day for 3 weeks up to
   * 17.10., that day `offsetKg` off it, and falling on for `daysAfter` days.
   */
  const fallingFast = (
    offsetKg: number,
    daysAfter = 0,
  ): CountingMeasurement[] =>
    countingMeasurements(
      Array.from({ length: 21 + daysAfter }, (_, i) => ({
        time: new Date(Date.UTC(2026, 8, 27 + i, 5)),
        kg: 100 - (1.4 / 7) * i + (i === 20 ? offsetKg : 0),
      })),
    );

  it("leaves the Ampel green 3 kg above a trend falling 1.4 kg per week, an Ausreißer", () => {
    const assessment = assess(fallingFast(3), "2026-10-17" as CalendarDay);

    expect(assessment.status).toMatchObject({
      trafficLight: "green",
      morningSentence: { kind: "outlier" },
    });
  });

  it.each(Array.from({ length: 13 }, (_, i) => i + 1))(
    "leaves the Ampel green %d days after it",
    (daysAfter) => {
      const counting = fallingFast(3, daysAfter);

      expect(
        assess(counting, counting[counting.length - 1].day).status,
      ).toMatchObject({ trafficLight: "green" });
    },
  );
});

describe("assess: the last measurement too old", () => {
  it.each([
    ["2026-10-21", 4],
    ["2026-11-30", 44],
  ])("on %s after the last measurement on 17.10. is %d days", (today, days) => {
    expect(
      assess(historyUntil("2026-10-17"), today as CalendarDay).status,
    ).toEqual({ kind: "lastMeasurementTooOld", days });
  });

  it("is not yet 3 days after it", () => {
    expect(
      assess(historyUntil("2026-10-17"), "2026-10-20" as CalendarDay).status,
    ).toMatchObject({ kind: "verdict" });
  });

  it("keeps „Gemessen“ and the trend of the last day with a measurement", () => {
    const counting = historyUntil("2026-10-20");

    const assessment = assess(counting, "2026-10-24" as CalendarDay);

    expect(assessment.status).toEqual({
      kind: "lastMeasurementTooOld",
      days: 4,
    });
    expect(assessment.measuredKg).toBe(96.9);
    expect(assessment.trend).toEqual(trends(counting).at(-1));
  });

  it("wins over the verdict of the last day with a measurement", () => {
    expect(
      assess(historyUntil("2026-10-18"), "2026-10-22" as CalendarDay).status,
    ).toEqual({ kind: "lastMeasurementTooOld", days: 4 });
  });
});

describe("assess: the figures beside the verdict", () => {
  it("from the first counting measurements on, with the trend of the last day", () => {
    const counting = historyUntil("2026-07-04");

    const assessment = assess(counting, "2026-07-04" as CalendarDay);

    expect(assessment).toMatchObject({
      status: { kind: "verdict" },
      measuredKg: 97.5,
      trend: trends(counting).at(-1),
    });
    expect(assessment.sixWeekSeries.measurements).toHaveLength(4);
  });

  it("after a gap, with the trend, the trend line and the outliers of the last day", () => {
    // 21.9. alone between two gaps; 4.10., 2 kg over the days before it, an
    // outlier.
    const afterGaps = countingFrom([
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
    ]);

    const assessment = assess(afterGaps, "2026-10-04" as CalendarDay);

    expect(assessment).toMatchObject({
      status: { kind: "verdict" },
      measuredKg: 99.0,
      trend: trends(afterGaps).at(-1),
    });
    expect(assessment.sixWeekSeries).toEqual(
      sixWeekSeries(afterGaps, "2026-10-04" as CalendarDay),
    );
    expect(assessment.sixWeekSeries.trendLine).not.toEqual([]);
    expect(assessment.sixWeekSeries.measurements.at(-1)?.outlier).toBe(true);
  });
});

describe("assess: no verdict yet", () => {
  it("without any measurement, nor „Gemessen“ then", () => {
    expect(assess([], "2026-10-17" as CalendarDay)).toEqual({
      status: { kind: "noVerdictYet" },
      measuredKg: null,
      trend: null,
      sixWeekSeries: { measurements: [], trendLine: [] },
    });
  });
});
