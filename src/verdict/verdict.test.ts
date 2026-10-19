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
 * pace of a day is its kg against the entry 7 before it, the 14-day pace
 * against the entry 14 before it.
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

/** `days` trends of 98 kg: no 14-day pace on the first 14, then 0. */
const flat = (days: number) => Array<number>(days).fill(98.0);

/**
 * 15 trends whose last day has a 14-day pace of 0 and a 7-day pace of
 * `kg` - 98 kg per week: its first day with a Frühwarnung.
 */
const weekPaceOnly = (kg: number) => [kg, ...flat(13), kg];

/**
 * 15 trends whose last day has a 7-day pace of 0 and a 14-day pace of
 * (98 - `firstKg`) / 2 kg per week: its first day with a Frühwarnung.
 */
const fortnightPaceOnly = (firstKg: number) => [firstKg, ...flat(14)];

/** The verdict of a history built by {@link everyDay}. */
function verdictOf(history: {
  trends: Trend[];
  counting: CountingMeasurement[];
}) {
  return trendVerdict(history.trends, history.counting);
}

describe("trendVerdict: the 7-day pace", () => {
  it("says „Nimmt ab“ where it falls further than its threshold, 1.25 × 0.80 × 0.7 kg per week", () => {
    expect(verdictOf(everyDay("2026-10-01", weekPaceOnly(97.29)))).toEqual({
      kind: "losing",
      days: 1,
      atLeast: true,
    });
  });

  it("leaves it to the 14-day pace exactly on minus its threshold, though it comes out a hair below", () => {
    expect(97.3 - 98.0).toBeLessThan(-0.7);
    expect(verdictOf(everyDay("2026-10-01", weekPaceOnly(97.3)))).toEqual({
      kind: "holding",
      days: 1,
      atLeast: true,
      level: 1,
    });
  });

  it("leaves it to the 14-day pace exactly on its threshold", () => {
    expect(verdictOf(everyDay("2026-10-01", weekPaceOnly(98.7)))).toMatchObject(
      { kind: "holding" },
    );
  });

  it("says „Nimmt zu“ where it rises further than its threshold", () => {
    expect(verdictOf(everyDay("2026-10-01", weekPaceOnly(98.71)))).toEqual({
      kind: "gaining",
      days: 1,
      atLeast: true,
      level: 1,
    });
  });

  it("takes its threshold from the Streuung of the day", () => {
    // 0.4 kg of Streuung: a threshold of 0.4 kg per week.
    const history = everyDay("2026-10-01", weekPaceOnly(97.55), 0.4);

    expect(verdictOf(history)).toMatchObject({ kind: "losing" });
  });

  it("wins over a 14-day pace rising further than its threshold", () => {
    const history = everyDay("2026-10-01", [96.0, ...flat(13), 97.29]);

    expect(verdictOf(history)).toMatchObject({ kind: "losing" });
  });

  it("wins over a 14-day pace falling further than its threshold", () => {
    const history = everyDay("2026-10-01", [100.0, ...flat(13), 98.71]);

    expect(verdictOf(history)).toMatchObject({ kind: "gaining" });
  });
});

describe("trendVerdict: the 14-day pace, where the 7-day pace is within its threshold", () => {
  it("says „Nimmt ab“ where it falls further than its threshold, 1.25 × 0.39 × 0.7 kg per week", () => {
    expect(verdictOf(everyDay("2026-10-01", fortnightPaceOnly(98.69)))).toEqual(
      { kind: "losing", days: 1, atLeast: true },
    );
  });

  it("says „Stagniert“ exactly on minus its threshold", () => {
    expect(
      verdictOf(everyDay("2026-10-01", fortnightPaceOnly(98.6825))),
    ).toMatchObject({ kind: "holding" });
  });

  it("says „Stagniert“ exactly on its threshold", () => {
    expect(
      verdictOf(everyDay("2026-10-01", fortnightPaceOnly(97.3175))),
    ).toMatchObject({ kind: "holding" });
  });

  it("says „Nimmt zu“ where it rises further than its threshold", () => {
    expect(verdictOf(everyDay("2026-10-01", fortnightPaceOnly(97.31)))).toEqual(
      { kind: "gaining", days: 1, atLeast: true, level: 1 },
    );
  });

  it("takes its threshold from the Streuung of the day", () => {
    // 0.4 kg of Streuung: a threshold of 0.195 kg per week.
    const history = everyDay("2026-10-01", fortnightPaceOnly(98.4), 0.4);

    expect(verdictOf(history)).toMatchObject({ kind: "losing" });
  });

  it("speaks alone where the day has no 7-day pace", () => {
    // A measurement every day, but no trend 7 to 10 days back.
    const history = everyDay("2026-10-01", fortnightPaceOnly(98.69));
    const withoutTrends = {
      ...history,
      trends: history.trends.filter((_, i) => i < 4 || i > 7),
    };

    expect(verdictOf(withoutTrends)).toMatchObject({ kind: "losing" });
  });
});

describe("trendVerdict: the headline", () => {
  it("is none where the last day has no 14-day pace", () => {
    expect(verdictOf(everyDay("2026-10-01", flat(14)))).toBeNull();
  });

  it("keeps the earlier Frühwarnung where the new one holds on one day", () => {
    expect(verdictOf(everyDay("2026-10-01", [...flat(15), 97.2]))).toEqual({
      kind: "holding",
      days: 2,
      atLeast: true,
      level: 1,
    });
  });

  it("shows the new Frühwarnung where it holds on two days with a measurement in a row", () => {
    expect(
      verdictOf(everyDay("2026-10-01", [...flat(15), 97.2, 97.1])),
    ).toEqual({ kind: "losing", days: 1, atLeast: false });
  });

  it("keeps the earlier Frühwarnung where two new ones follow each other", () => {
    expect(
      verdictOf(everyDay("2026-10-01", [...flat(15), 97.2, 98.8])),
    ).toMatchObject({ kind: "holding", days: 3 });
  });

  it("counts two days with a measurement in a row across a day without one", () => {
    const history = everyDay("2026-10-01", [...flat(15), 97.2, 97.1]);
    const lastMovedOn = {
      trends: history.trends.map((trend, i) =>
        i === 16 ? { ...trend, day: dayAfter("2026-10-01", 17) } : trend,
      ),
      counting: history.counting.map((measurement, i) =>
        i === 16
          ? { ...measurement, day: dayAfter("2026-10-01", 17) }
          : measurement,
      ),
    };

    expect(verdictOf(lastMovedOn)).toEqual({
      kind: "losing",
      days: 2,
      atLeast: false,
    });
  });

  it("counts the days since the headline showed something else, not since the Frühwarnung said so", () => {
    expect(
      verdictOf(everyDay("2026-10-01", [...flat(15), 97.2, 97.1, 97.0])),
    ).toEqual({ kind: "losing", days: 2, atLeast: false });
  });

  it.each([
    [6, 1],
    [7, 2],
    [13, 2],
    [14, 3],
    [40, 3],
  ])("puts %d days of „Stagniert“ on Warnstufe %d", (days, level) => {
    expect(verdictOf(everyDay("2026-09-01", flat(14 + days)))).toEqual({
      kind: "holding",
      days,
      atLeast: true,
      level,
    });
  });

  it("puts „Nimmt zu“ on the Warnstufe of its days too", () => {
    const rising = Array.from({ length: 14 + 14 }, (_, i) => 98.0 + 0.2 * i);

    expect(verdictOf(everyDay("2026-09-01", rising))).toEqual({
      kind: "gaining",
      days: 14,
      atLeast: true,
      level: 3,
    });
  });

  it("compares only with days from the first after the last gap on, and shows its first Frühwarnung at once", () => {
    // Stagnating up to 28.9.; after the gap 2.10. to 16.10. falling fast.
    const before = everyDay("2026-09-01", flat(28));
    const after = everyDay(
      "2026-10-02",
      Array.from({ length: 15 }, (_, i) => 98 - 0.5 * i),
    );
    const lastDays = (days: number) =>
      verdictOf({
        trends: [...before.trends, ...after.trends.slice(0, days)],
        counting: [...before.counting, ...after.counting.slice(0, days)],
      });

    expect(lastDays(14)).toBeNull();
    expect(lastDays(15)).toEqual({ kind: "losing", days: 1, atLeast: true });
  });
});

/** The day `days` days after `day`. */
function dayAfter(day: string, days: number): CalendarDay {
  // Safe: every day these tests write is a valid `YYYY-MM-DD`.
  return calendarDayBefore(day as CalendarDay, -days);
}
