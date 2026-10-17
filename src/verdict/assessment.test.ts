import { describe, expect, it } from "vitest";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
  type Measurement,
} from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { sixWeekSeries } from "@/trend/six-week-series";
import { assess } from "./assessment";

/** The counting measurements of the fixture up to `day`, as the page has them on that day. */
const historyUntil = (day: string, extra: Measurement[] = []) =>
  countingMeasurements(
    [...weightHistory(), ...extra].filter(
      (measurement) => berlinDay(measurement.time) <= day,
    ),
  );

/** The assessment of the fixture on `day`, the day itself the last with a measurement. */
const assessOn = (day: string) => assess(historyUntil(day), day as CalendarDay);

describe("assess: the verdict on the fixture", () => {
  it.each(["2026-10-12", "2026-10-17"])("is „Nimmt ab“ on %s", (day) => {
    expect(assessOn(day).status).toEqual({ kind: "losing" });
  });

  it("is no decrease on 8.8.2026 at the latest", () => {
    expect(assessOn("2026-08-08").status.kind).toBe("noDecrease");
  });

  it("is no decrease on the highest level on 30.8.2026", () => {
    expect(assessOn("2026-08-30").status).toMatchObject({
      kind: "noDecrease",
      level: 3,
    });
  });
});

describe("assess: the figures", () => {
  it("carries the trend, „Gemessen“ and the 4-week pace of the last day with a measurement", () => {
    const assessment = assess(
      historyUntil("2026-10-17"),
      "2026-10-18" as CalendarDay,
    );

    expect(assessment.measuredKg).toBe(98.6);
    expect(assessment.trendKg).toBeCloseTo(97.75);
    expect(assessment.pace).toEqual({ kgPerWeek: -0.42, band: "slowLoss" });
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
  /** A trend falling 0.5 kg per week, measured every day for 3 weeks up to 17.10., the last day `offsetKg` off it. */
  const fallingFast = (offsetKg: number): CountingMeasurement[] =>
    countingMeasurements(
      Array.from({ length: 21 }, (_, i) => ({
        time: new Date(Date.UTC(2026, 8, 27 + i, 5)),
        kg: 100 - (0.5 / 7) * i + (i === 20 ? offsetKg : 0),
      })),
    );

  it("leaves the verdict at „Nimmt ab“ 3 kg above a trend falling 0.5 kg per week", () => {
    const assessment = assess(fallingFast(3), "2026-10-17" as CalendarDay);

    expect(assessment.status).toEqual({ kind: "losing" });
  });
});

describe("assess: the last measurement too old", () => {
  it.each([
    ["2026-10-20", { kind: "losing" }],
    ["2026-10-21", { kind: "lastMeasurementTooOld", days: 4 }],
    ["2026-11-30", { kind: "lastMeasurementTooOld", days: 44 }],
  ])("on %s after the last measurement on 17.10. is %o", (today, status) => {
    expect(
      assess(historyUntil("2026-10-17"), today as CalendarDay).status,
    ).toEqual(status);
  });

  it("wins over too few measurements for a trend, which still leave no trend", () => {
    const assessment = assess(
      historyUntil("2026-07-03"),
      "2026-07-07" as CalendarDay,
    );

    expect(assessment.status).toEqual({
      kind: "lastMeasurementTooOld",
      days: 4,
    });
    expect(assessment.trendKg).toBeNull();
  });

  it("wins over the comparison after a gap", () => {
    expect(
      assess(historyUntil("2026-10-03"), "2026-10-07" as CalendarDay).status,
    ).toEqual({ kind: "lastMeasurementTooOld", days: 4 });
  });
});

describe("assess: after the gap 22.9. to 1.10.", () => {
  it("compares on 3.10., the 3rd measurement after it: a clear increase", () => {
    const { status } = assessOn("2026-10-03");

    expect(status).toMatchObject({
      kind: "gapComparison",
      gapDays: 9,
      variation: "clearIncrease",
    });
    expect(status.kind === "gapComparison" && status.differenceKg).toBeCloseTo(
      1.0,
      1,
    );
  });

  it("compares on 4.10., the 4th: within the normal variation", () => {
    const { status } = assessOn("2026-10-04");

    expect(status).toMatchObject({
      kind: "gapComparison",
      variation: "withinNormalVariation",
    });
    expect(status.kind === "gapComparison" && status.differenceKg).toBeCloseTo(
      0.3,
      1,
    );
  });

  it("gives the verdict again from the 5th on, 5.10.", () => {
    expect(assessOn("2026-10-05").status).toEqual({ kind: "losing" });
  });
  it("counts no decrease after a gap only from the first day after it", () => {
    const fastLossThenFlat = countingMeasurements([
      ...Array.from({ length: 15 }, (_, i) => ({
        time: new Date(Date.UTC(2026, 7, 18 + i, 5)),
        kg: 98.0 - i * 0.15,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        time: new Date(Date.UTC(2026, 9, 1 + i, 5)),
        kg: 95.9,
      })),
    ]);

    expect(
      assess(fastLossThenFlat, "2026-10-05" as CalendarDay).status,
    ).toEqual({
      kind: "noDecrease",
      days: 4,
      atLeast: true,
      since: "2026-10-01",
      level: 1,
    });
  });
});

describe("assess: no verdict yet", () => {
  it("while the counting measurements do not suffice for a trend, without trend, pace or trend line", () => {
    const assessment = assessOn("2026-07-04");

    expect(assessment).toMatchObject({
      status: { kind: "noVerdictYet" },
      measuredKg: 97.5,
      trendKg: null,
      pace: null,
    });
    expect(assessment.sixWeekSeries.measurements).toHaveLength(4);
  });

  it("after a gap with no trend before it, without the trend after it either", () => {
    const fewBefore = countingMeasurements(
      [
        ["2026-09-21", 99.0],
        ["2026-09-22", 99.2],
        ["2026-09-26", 99.4],
        ["2026-09-27", 99.6],
        ["2026-09-28", 99.8],
        ["2026-09-29", 103.0],
      ].map(([day, kg]) => ({
        time: new Date(`${day}T05:00:00Z`),
        kg: Number(kg),
      })),
    );

    const assessment = assess(fewBefore, "2026-09-29" as CalendarDay);

    expect(assessment).toMatchObject({
      status: { kind: "noVerdictYet" },
      measuredKg: 103.0,
      trendKg: null,
      pace: null,
    });
    expect(assessment.sixWeekSeries.trendLine).toEqual([]);
    expect(
      assessment.sixWeekSeries.measurements.map(({ outlier }) => outlier),
    ).toEqual([false, false, false, false, false, false]);
  });

  it("without any measurement, nor „Gemessen“ then", () => {
    expect(assess([], "2026-10-17" as CalendarDay)).toEqual({
      status: { kind: "noVerdictYet" },
      measuredKg: null,
      trendKg: null,
      pace: null,
      sixWeekSeries: { measurements: [], trendLine: [] },
    });
  });
});
