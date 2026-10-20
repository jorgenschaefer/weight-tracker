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

describe("assess: the Frühwarnung on the fixture (AC-6)", () => {
  it.each([
    ["2026-07-18", { kind: "noVerdictYet" }],
    ["2026-07-19", { kind: "gaining", days: 1, atLeast: true, level: 1 }],
    ["2026-09-15", { kind: "gaining", days: 17, atLeast: false, level: 3 }],
    ["2026-10-01", { kind: "noVerdictYet" }],
    ["2026-10-14", { kind: "noVerdictYet" }],
    ["2026-10-15", { kind: "losing", days: 1, atLeast: true }],
    ["2026-10-17", { kind: "losing", days: 3, atLeast: true }],
    ["2026-10-18", { kind: "gaining", days: 1, atLeast: false, level: 1 }],
    ["2026-10-19", { kind: "gaining", days: 2, atLeast: false, level: 1 }],
  ])("on %s is %o", (day, status) => {
    expect(assessOn(day).status).toMatchObject(status);
  });

  it("changes the headline only on 29.7., 7.8., 22.8., 30.8., 16.9., 20.9. and 22.9. between 19.7. and 22.9.", () => {
    const changes = countingMeasurements(weightHistoryUntil("2026-09-22"))
      .map((measurement) => measurement.day)
      .filter((day) => day >= "2026-07-19")
      .flatMap((day) => {
        const { status } = assessOn(day);
        return "atLeast" in status && status.days === 1 && !status.atLeast
          ? [[day, status.kind]]
          : [];
      });

    expect(changes).toEqual([
      ["2026-07-29", "losing"],
      ["2026-08-07", "gaining"],
      ["2026-08-22", "holding"],
      ["2026-08-30", "gaining"],
      ["2026-09-16", "holding"],
      ["2026-09-20", "losing"],
      ["2026-09-22", "holding"],
    ]);
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

describe("assess: a steady slow loss (AC-7)", () => {
  /**
   * A measurement every day for 8 weeks, 0.7 kg above and below a line
   * falling 0.5 kg per week in turn, the first above it.
   */
  const slowLoss = countingMeasurements(
    Array.from({ length: 8 * 7 }, (_, i) => ({
      time: new Date(Date.UTC(2026, 7, 1 + i, 5)),
      kg: 98 - (0.5 / 7) * i + (i % 2 === 0 ? 0.7 : -0.7),
    })),
  );

  it("is „Nimmt ab“ on every day from the first with a Frühwarnung on", () => {
    const kinds = slowLoss.map(
      (measurement, i) =>
        assess(slowLoss.slice(0, i + 1), measurement.day).status.kind,
    );
    const first = kinds.findIndex((kind) => kind !== "noVerdictYet");

    expect(first).toBeGreaterThan(0);
    expect(new Set(kinds.slice(first))).toEqual(new Set(["losing"]));
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
    ["2026-10-20", { kind: "losing", days: 3, atLeast: true }],
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

  it("wins over „Noch kein Urteil“ after a gap", () => {
    expect(
      assess(historyUntil("2026-10-03"), "2026-10-07" as CalendarDay).status,
    ).toEqual({ kind: "lastMeasurementTooOld", days: 4 });
  });
});

describe("assess: after the gap 22.9. to 1.10.", () => {
  it.each(["2026-10-03", "2026-10-04"])(
    "is „Noch kein Urteil“ on %s, with no comparison after the gap",
    (day) => {
      expect(assessOn(day).status).toEqual({ kind: "noVerdictYet" });
    },
  );

  it("is „Noch kein Urteil“ until the day has a 14-day pace after the gap: on 14.10. still, on 15.10. no more", () => {
    expect(assessOn("2026-10-14").status).toEqual({ kind: "noVerdictYet" });
    expect(assessOn("2026-10-15").status).toMatchObject({ kind: "losing" });
  });

  it("is „Noch kein Urteil“ after the later of two gaps", () => {
    const twoGaps = countingFrom([
      ...Array.from({ length: 20 }, (_, i): [string, number] => [
        `2026-09-${String(i + 1).padStart(2, "0")}`,
        95.0,
      ]),
      ["2026-09-24", 95.0],
      ["2026-09-30", 95.0],
    ]);

    expect(assess(twoGaps, "2026-09-30" as CalendarDay).status).toEqual({
      kind: "noVerdictYet",
    });
  });

  it("is „Noch kein Urteil“ despite a 14-day pace across the gap", () => {
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

    expect(assess(risingAcrossGap, "2026-09-29" as CalendarDay).status).toEqual(
      { kind: "noVerdictYet" },
    );
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

  it("while the trend has no 14-day pace yet, with the trend", () => {
    // A trend from 5.7. on, a 14-day pace from 19.7. on.
    expect(assessOn("2026-07-18")).toMatchObject({
      status: { kind: "noVerdictYet" },
      trendKg: expect.any(Number),
    });
    expect(assessOn("2026-07-19").status.kind).not.toBe("noVerdictYet");
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
    });
  });
});
