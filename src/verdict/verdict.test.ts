import { describe, expect, it } from "vitest";
import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";
import type { CountingMeasurement } from "@/measurement/measurement";
import type { Trend } from "@/trend/trend";
import { trendVerdict } from "./verdict";

/**
 * A trend of each of `kgs` on the days from `first` on, one a day, and a
 * counting measurement `offsetKg` above and below it in turn: a Streuung of
 * `offsetKg`, or 0.7 kg while fewer than 10 days lie before a day. The 7-day
 * pace of a day is its kg against those 7 entries before it.
 */
function everyDay(first: string, kgs: number[], offsetKg = 0.7) {
  const days = kgs.map((_, i) => dayAfter(first, i));
  const trends: Trend[] = kgs.map((kg, i) => ({
    day: days[i],
    kg,
  }));
  const counting: CountingMeasurement[] = kgs.map((kg, i) => ({
    time: new Date(`${days[i]}T07:00:00+02:00`),
    kg: kg + (i % 2 === 0 ? offsetKg : -offsetKg),
    day: days[i],
  }));
  return { trends, counting };
}

/** `days` trends of 98 kg: no 7-day pace on the first 7, then 0. */
const flat = (days: number) => Array<number>(days).fill(98.0);

/** The verdict of a history built by {@link everyDay}. */
function verdictOf(history: {
  trends: Trend[];
  counting: CountingMeasurement[];
}) {
  return trendVerdict(history.trends, history.counting);
}

describe("trendVerdict", () => {
  it("is „Nimmt ab“ where the 7-day pace falls further than the threshold, 1.25 × 0.80 × 0.7 kg per week", () => {
    expect(verdictOf(everyDay("2026-10-01", [...flat(7), 97.29]))).toEqual({
      kind: "losing",
      days: 1,
      atLeast: true,
    });
  });

  it("is „Stagniert“ at a 7-day pace exactly on minus the threshold, though it comes out a hair below", () => {
    expect(97.3 - 98.0).toBeLessThan(-0.7);
    expect(verdictOf(everyDay("2026-10-01", [...flat(7), 97.3]))).toEqual({
      kind: "holding",
      days: 1,
      atLeast: true,
      level: 1,
    });
  });

  it("is „Stagniert“ at a 7-day pace exactly on the threshold", () => {
    expect(verdictOf(everyDay("2026-10-01", [...flat(7), 98.7]))).toMatchObject(
      { kind: "holding" },
    );
  });

  it("is „Nimmt zu“ where the 7-day pace rises further than the threshold", () => {
    expect(verdictOf(everyDay("2026-10-01", [...flat(7), 98.71]))).toEqual({
      kind: "gaining",
      days: 1,
      atLeast: true,
      level: 1,
    });
  });

  it("takes the threshold from the Streuung of the day", () => {
    // 0.4 kg of Streuung over 10 days before the last: a threshold of 0.4.
    const history = everyDay("2026-10-01", [...flat(10), 97.55], 0.4);

    expect(verdictOf(history)).toMatchObject({ kind: "losing" });
  });

  it("counts the days since the last day it said something else", () => {
    // Falling on 8.10., then stagnating against 2.10. to 4.10.
    const history = everyDay("2026-10-01", [
      ...flat(7),
      97.0,
      97.9,
      97.95,
      97.9,
    ]);

    expect(verdictOf(history)).toEqual({
      kind: "holding",
      days: 3,
      atLeast: false,
      level: 1,
    });
  });

  it("counts „at least“ the days since the last day it said nothing", () => {
    expect(verdictOf(everyDay("2026-10-01", [...flat(7), 97.0, 96.9]))).toEqual(
      { kind: "losing", days: 2, atLeast: true },
    );
  });

  it("counts only days with a measurement", () => {
    const history = everyDay("2026-10-01", [...flat(7), 97.0, 97.9, 97.95]);
    const lastMovedOn = {
      trends: history.trends.map((trend, i) =>
        i === 9 ? { ...trend, day: dayAfter("2026-10-01", 11) } : trend,
      ),
      counting: history.counting.map((measurement, i) =>
        i === 9
          ? { ...measurement, day: dayAfter("2026-10-01", 11) }
          : measurement,
      ),
    };

    expect(verdictOf(lastMovedOn)).toMatchObject({
      kind: "holding",
      days: 4,
      atLeast: false,
    });
  });

  it.each([
    [6, 1],
    [7, 2],
    [13, 2],
    [14, 3],
    [40, 3],
  ])("puts %d days of „Stagniert“ on Warnstufe %d", (days, level) => {
    expect(verdictOf(everyDay("2026-09-01", flat(7 + days)))).toEqual({
      kind: "holding",
      days,
      atLeast: true,
      level,
    });
  });

  it("puts „Nimmt zu“ on the Warnstufe of its days too", () => {
    const rising = Array.from({ length: 7 + 14 }, (_, i) => 98.0 + 0.2 * i);

    expect(verdictOf(everyDay("2026-09-01", rising))).toEqual({
      kind: "gaining",
      days: 14,
      atLeast: true,
      level: 3,
    });
  });

  it("is none where the last day has no 7-day pace", () => {
    expect(verdictOf(everyDay("2026-10-01", flat(7)))).toBeNull();
  });

  it("compares only with days from the first after the last gap on", () => {
    // Falling fast up to 28.9.; after the gap 2.10. to 9.10. stagnate.
    const before = everyDay(
      "2026-09-15",
      Array.from({ length: 14 }, (_, i) => 100 - 0.5 * i),
    );
    const after = everyDay("2026-10-02", flat(8));
    const lastDays = (days: number) =>
      verdictOf({
        trends: [...before.trends, ...after.trends.slice(0, days)],
        counting: [...before.counting, ...after.counting.slice(0, days)],
      });

    expect(lastDays(7)).toBeNull();
    expect(lastDays(8)).toEqual({
      kind: "holding",
      days: 1,
      atLeast: true,
      level: 1,
    });
  });
});

/** The day `days` days after `day`. */
function dayAfter(day: string, days: number): CalendarDay {
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  return calendarDayBefore(day as CalendarDay, -days);
}
