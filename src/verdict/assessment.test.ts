import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
  type Measurement,
} from "@/measurement/measurement";
import { weightHistoryUntil } from "@/test/weight-history-fixture";
import { sixWeekSeries } from "@/trend/six-week-series";
import { assess } from "./assessment";

/** Counting measurements of [day, kg] pairs, each at 05:00 UTC. */
const countingFrom = (days: [string, number][]) =>
  countingMeasurements(
    days.map(([day, kg]) => ({ time: new Date(`${day}T05:00:00Z`), kg })),
  );

/** The counting measurements of the fixture, 18.10. and 19.10. up to `day`, as the page has them on that day. */
const historyUntil = (day: string, extra: Measurement[] = []) =>
  countingMeasurements(weightHistoryUntil(day, extra));

/** The assessment of the fixture, 18.10. and 19.10. on `day`, the day itself the last with a measurement. */
const assessOn = (day: string) => assess(historyUntil(day), day as CalendarDay);

describe("assess: the Frühwarnung on the fixture (AC-11)", () => {
  it.each([
    ["2026-10-08", { kind: "losing", days: 1, atLeast: true }],
    ["2026-10-12", { kind: "losing", days: 5, atLeast: true }],
    ["2026-10-13", { kind: "holding", days: 1, atLeast: false, level: 1 }],
    ["2026-10-16", { kind: "holding", days: 4, atLeast: false, level: 1 }],
    ["2026-10-17", { kind: "gaining", days: 1, atLeast: false, level: 1 }],
    ["2026-10-19", { kind: "gaining", days: 3, atLeast: false, level: 1 }],
  ])("on %s is %o", (day, status) => {
    expect(assessOn(day).status).toEqual(status);
  });

  it("carries the 4-week pace of 19.10., still a loss", () => {
    expect(assessOn("2026-10-19").pace).toEqual({
      kgPerWeek: -0.33,
      band: "loss",
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
    expect(assessment.pace).toEqual({ kgPerWeek: -0.42, band: "loss" });
  });

  it("sorts the 4-week pace by the threshold of the scatter of the last day", () => {
    // On a straight line the scatter is 0: so is the threshold, and a loss of
    // 0.15 kg per week is a loss.
    const slowLoss = countingFrom(
      Array.from({ length: 40 }, (_, i): [string, number] => [
        calendarDayBefore("2026-10-17" as CalendarDay, 39 - i),
        100 - (0.15 / 7) * i,
      ]),
    );

    expect(assess(slowLoss, "2026-10-17" as CalendarDay).pace).toEqual({
      kgPerWeek: -0.15,
      band: "loss",
    });
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
   * 3 kg off raises the Streuung of the days after it to at most 0.95 kg, the
   * threshold of the 7-day pace to at most 0.95 kg per week.
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

  it("leaves the verdict at „Nimmt ab“ 3 kg above a trend falling 1.4 kg per week", () => {
    const assessment = assess(fallingFast(3), "2026-10-17" as CalendarDay);

    expect(assessment.status).toMatchObject({ kind: "losing" });
  });

  it.each(Array.from({ length: 13 }, (_, i) => i + 1))(
    "leaves the verdict at „Nimmt ab“ %d days after it, never „Nimmt zu“",
    (daysAfter) => {
      const counting = fallingFast(3, daysAfter);

      expect(
        assess(counting, counting[counting.length - 1].day).status,
      ).toMatchObject({ kind: "losing" });
    },
  );
});

describe("assess: the last measurement too old", () => {
  it.each([
    ["2026-10-20", { kind: "gaining", days: 1, atLeast: false, level: 1 }],
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

  it("wins over „Nimmt zu“", () => {
    expect(
      assess(historyUntil("2026-10-18"), "2026-10-22" as CalendarDay).status,
    ).toEqual({ kind: "lastMeasurementTooOld", days: 4 });
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

  it("compares until the day has a 7-day pace after the gap: on 7.10. still, on 8.10. no more", () => {
    expect(assessOn("2026-10-07").status).toMatchObject({
      kind: "gapComparison",
      gapDays: 9,
    });
    expect(assessOn("2026-10-08").status).toMatchObject({ kind: "losing" });
  });

  it("compares after the later of two gaps", () => {
    const twoGaps = countingFrom([
      ...Array.from({ length: 20 }, (_, i): [string, number] => [
        `2026-09-${String(i + 1).padStart(2, "0")}`,
        95.0,
      ]),
      ["2026-09-24", 95.0],
      ["2026-09-30", 95.0],
    ]);

    expect(assess(twoGaps, "2026-09-30" as CalendarDay).status).toMatchObject({
      kind: "gapComparison",
      gapDays: 6,
    });
  });

  it("wins over a 7-day pace across the gap", () => {
    // Rising 2.1 kg a week before the gap and after it.
    const risingAcrossGap = countingFrom([
      ...Array.from({ length: 20 }, (_, i): [string, number] => [
        `2026-09-${String(i + 1).padStart(2, "0")}`,
        95.0 + i * 0.3,
      ]),
      ["2026-09-25", 102.0],
      ["2026-09-27", 103.0],
      ["2026-09-29", 104.0],
    ]);

    expect(
      assess(risingAcrossGap, "2026-09-29" as CalendarDay).status,
    ).toMatchObject({ kind: "gapComparison", gapDays: 5 });
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

  it("while the trend has no 7-day pace yet, with the trend", () => {
    // A trend from 5.7. on, a 7-day pace from 12.7. on.
    expect(assessOn("2026-07-11")).toMatchObject({
      status: { kind: "noVerdictYet" },
      trendKg: expect.any(Number),
    });
    expect(assessOn("2026-07-12").status.kind).not.toBe("noVerdictYet");
  });

  it("after a gap with no trend before it, with the trend, the pace, the trend line and the outliers of the last day", () => {
    // A trend from 5.9. on; 21.9. alone, without one; after it, 4.10. the
    // first day with a trend again, the 4th measurement after the gap, and 2 kg
    // over it an outlier.
    const noTrendBeforeTheGap = countingFrom([
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

    const assessment = assess(noTrendBeforeTheGap, "2026-10-04" as CalendarDay);

    expect(assessment).toMatchObject({
      status: { kind: "noVerdictYet" },
      measuredKg: 99.0,
      trendKg: 97.0,
      pace: { kgPerWeek: -0.5, band: "loss" },
    });
    expect(assessment.sixWeekSeries).toEqual(
      sixWeekSeries(noTrendBeforeTheGap, "2026-10-04" as CalendarDay),
    );
    expect(assessment.sixWeekSeries.trendLine).not.toEqual([]);
    expect(assessment.sixWeekSeries.measurements.at(-1)?.outlier).toBe(true);
  });

  it("without any measurement, nor „Gemessen“ then", () => {
    expect(assess([], "2026-10-17" as CalendarDay)).toEqual({
      status: { kind: "noVerdictYet" },
      measuredKg: null,
      trendKg: null,
      pace: null,
      sixWeekSeries: { measurements: [], trendLine: [] },
      morningDeviation: null,
    });
  });
});

describe("assess: the deviation of the morning", () => {
  it("stands with the verdict of the trend, from the scatter of the last day", () => {
    const { morningDeviation } = assessOn("2026-10-12");

    expect(morningDeviation?.day).toBe("2026-10-12");
    expect(morningDeviation?.differenceKg).toBeCloseTo(2.6);
  });

  it("is none with the verdict where the measurement is within the threshold", () => {
    expect(assessOn("2026-10-16").morningDeviation).toBeNull();
  });

  it("is none where the last measurement is too old", () => {
    expect(
      assess(historyUntil("2026-10-12"), "2026-10-16" as CalendarDay)
        .morningDeviation,
    ).toBeNull();
  });
});
