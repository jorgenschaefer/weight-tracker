import { describe, expect, it } from "vitest";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
  type Measurement,
} from "@/measurement/measurement";
import { weightHistory } from "@/test/weight-history-fixture";
import { sixWeekSeries } from "@/trend/six-week-series";
import { trends } from "@/trend/trend";
import { assess } from "./assessment";
import { trendVerdict } from "./verdict";

/** Counting measurements of [day, kg] pairs, each at 05:00 UTC. */
const countingFrom = (days: [string, number][]) =>
  countingMeasurements(
    days.map(([day, kg]) => ({ time: new Date(`${day}T05:00:00Z`), kg })),
  );

/** The counting measurements of the fixture up to `day`, as the page has them on that day. */
const historyUntil = (day: string, extra: Measurement[] = []) =>
  countingMeasurements(
    [...weightHistory(), ...extra].filter(
      (measurement) => berlinDay(measurement.time) <= day,
    ),
  );

/** The 18.10.2026 the fixture lacks: 98.4 kg, the day after its last. */
const OCTOBER_18: Measurement[] = [
  { time: new Date("2026-10-18T07:00:00+02:00"), kg: 98.4 },
];

/** The assessment of the fixture and 18.10. on `day`, the day itself the last with a measurement. */
const assessOn = (day: string) =>
  assess(historyUntil(day, OCTOBER_18), day as CalendarDay);

describe("assess: the verdict on the fixture", () => {
  it("is „Nimmt ab“ on 12.10.2026", () => {
    expect(assessOn("2026-10-12").status).toEqual({ kind: "losing" });
  });

  it("is no decrease since 3 days on 13.10.2026, after the last falling trend on 10.10.", () => {
    expect(assessOn("2026-10-13").status).toEqual({
      kind: "noDecrease",
      days: 3,
      atLeast: false,
      since: "2026-10-10",
      level: 1,
    });
  });

  it.each([
    ["2026-10-17", 7, "2026-10-10", 2],
    ["2026-10-18", 8, "2026-10-10", 2],
    ["2026-07-13", 2, "2026-07-11", 1],
    ["2026-08-04", 2, "2026-08-02", 1],
    ["2026-08-30", 28, "2026-08-02", 3],
  ])(
    "is „Nimmt zu“ on %s, %d days after the last falling trend on %s, on level %d",
    (day, days, since, level) => {
      expect(assessOn(day).status).toEqual({
        kind: "gaining",
        days,
        atLeast: false,
        since,
        level,
      });
    },
  );

  it("is „Nimmt zu“ on 18.10.2026 with the 4-week pace still a loss", () => {
    expect(assessOn("2026-10-18").pace?.band).toBe("loss");
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
   * A trend falling 0.5 kg per week, measured every day for 3 weeks up to
   * 17.10., that day `offsetKg` off it, and falling on for `daysAfter` days.
   */
  const fallingFast = (
    offsetKg: number,
    daysAfter = 0,
  ): CountingMeasurement[] =>
    countingMeasurements(
      Array.from({ length: 21 + daysAfter }, (_, i) => ({
        time: new Date(Date.UTC(2026, 8, 27 + i, 5)),
        kg: 100 - (0.5 / 7) * i + (i === 20 ? offsetKg : 0),
      })),
    );

  it("leaves the verdict at „Nimmt ab“ 3 kg above a trend falling 0.5 kg per week", () => {
    const assessment = assess(fallingFast(3), "2026-10-17" as CalendarDay);

    expect(assessment.status).toEqual({ kind: "losing" });
  });

  it.each(Array.from({ length: 13 }, (_, i) => i + 1))(
    "leaves the verdict at „Nimmt ab“ %d days after it, never „Nimmt zu“",
    (daysAfter) => {
      const counting = fallingFast(3, daysAfter);

      expect(
        assess(counting, counting[counting.length - 1].day).status,
      ).toEqual({
        kind: "losing",
      });
    },
  );
});

describe("assess: the last measurement too old", () => {
  it.each([
    [
      "2026-10-20",
      {
        kind: "gaining",
        days: 7,
        atLeast: false,
        since: "2026-10-10",
        level: 2,
      },
    ],
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
      assess(
        historyUntil("2026-10-18", OCTOBER_18),
        "2026-10-22" as CalendarDay,
      ).status,
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

  it("wins over „Nimmt zu“", () => {
    const risingAcrossGap = countingFrom([
      ...Array.from({ length: 20 }, (_, i): [string, number] => [
        `2026-09-${String(i + 1).padStart(2, "0")}`,
        95.0 + i * 0.3,
      ]),
      ["2026-09-25", 102.0],
      ["2026-09-27", 103.0],
      ["2026-09-29", 104.0],
    ]);
    expect(trendVerdict(trends(risingAcrossGap), risingAcrossGap).kind).toEqual(
      "gaining",
    );

    expect(
      assess(risingAcrossGap, "2026-09-29" as CalendarDay).status,
    ).toMatchObject({ kind: "gapComparison", gapDays: 5 });
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
    const fewBefore = countingFrom([
      ["2026-09-21", 99.0],
      ["2026-09-22", 99.2],
      ["2026-09-26", 99.4],
      ["2026-09-27", 99.6],
      ["2026-09-28", 99.8],
      ["2026-09-29", 103.0],
    ]);

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

  it("wins over „Nimmt zu“ after a gap with no trend before it", () => {
    const fewBeforeThenRising = countingFrom([
      ["2026-09-18", 99.0],
      ["2026-09-19", 99.1],
      ["2026-09-20", 99.2],
      ["2026-09-21", 99.3],
      ["2026-09-25", 100.0],
      ["2026-09-27", 101.0],
      ["2026-09-29", 102.0],
    ]);
    expect(
      trendVerdict(trends(fewBeforeThenRising), fewBeforeThenRising).kind,
    ).toEqual("gaining");

    expect(
      assess(fewBeforeThenRising, "2026-09-29" as CalendarDay).status,
    ).toEqual({ kind: "noVerdictYet" });
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
