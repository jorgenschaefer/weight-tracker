import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import { countingMeasurements } from "@/measurement/measurement";
import reference from "@/test/fixtures/kalman-reference.json";
import { weightHistoryUntil } from "@/test/weight-history-fixture";
import { type Trend, trends } from "@/trend/trend";
import {
  isLossLikelier,
  lossCertainty,
  type TrafficLight,
  trafficLight,
} from "./traffic-light";

describe("lossCertainty and trafficLight on the test data (AC-1)", () => {
  const filtered = trends(
    countingMeasurements(weightHistoryUntil("2026-10-20")),
  );
  const colours: Record<string, TrafficLight> = {
    grün: "green",
    gelb: "yellow",
    rot: "red",
  };

  it.each(reference.map((expected, i) => [expected.day, expected, i] as const))(
    "on %s are what kalman.py's traffic_light gives",
    (_, expected, i) => {
      expect(lossCertainty(filtered[i])).toBeCloseTo(
        1 - expected.pNotLosing,
        6,
      );
      expect(trafficLight(filtered[i])).toBe(colours[expected.light]);
    },
  );
});

describe("trafficLight and lossCertainty on the test data (AC-7)", () => {
  it.each<[string, TrafficLight, "loss" | "no loss", number]>([
    ["2026-07-13", "red", "no loss", 92],
    ["2026-07-14", "red", "no loss", 90],
    ["2026-10-01", "red", "no loss", 95],
    ["2026-10-03", "red", "no loss", 86],
    ["2026-10-04", "yellow", "no loss", 73],
    ["2026-10-05", "yellow", "no loss", 54],
    ["2026-10-06", "yellow", "loss", 64],
    ["2026-10-08", "green", "loss", 88],
    ["2026-10-09", "green", "loss", 91],
    ["2026-10-12", "green", "loss", 91],
    ["2026-10-13", "green", "loss", 89],
    ["2026-10-17", "green", "loss", 81],
    ["2026-10-18", "yellow", "loss", 74],
    ["2026-10-19", "green", "loss", 84],
    ["2026-10-20", "green", "loss", 90],
  ])(
    "on %s is %s, and %s the more likely side at %i %%",
    (day, light, side, percent) => {
      const upToDay = trends(countingMeasurements(weightHistoryUntil(day)));
      const trend = upToDay[upToDay.length - 1];
      const certainty = lossCertainty(trend);

      expect(trafficLight(trend)).toBe(light);
      expect(isLossLikelier(certainty) ? "loss" : "no loss").toBe(side);
      // To two decimals: in whole percent, rounded.
      expect(side === "loss" ? certainty : 1 - certainty).toBeCloseTo(
        percent / 100,
        2,
      );
    },
  );
});

/** A trend whose pace is `pace` ± `sd` kg per week. */
const withPace = (pace: number, sd: number): Trend => ({
  // Safe: a valid `YYYY-MM-DD`.
  day: "2026-10-20" as CalendarDay,
  kg: 97,
  kgVariance: 0.1,
  pace,
  paceVariance: sd * sd,
  z: 0,
});

/** How many standard deviations a normal value lies under its 80 % quantile. */
const QUANTILE_80 = 0.8416212335729143;

describe("lossCertainty", () => {
  it.each([
    [-0.1, 0.5, 0.5],
    [-0.1 - 3 * 0.2, 0.2, 0.9986501019683699],
    [-0.1 + 3 * 0.2, 0.2, 0.0013498980316301],
    [-0.1 - 6 * 0.1, 0.1, 0.9999999990134123],
    [-0.1 - 3000 * 0.01, 0.01, 1],
    [-0.1 + 3000 * 0.01, 0.01, 0],
  ])("of a pace of %f ± %f kg per week is %f", (pace, sd, certainty) => {
    expect(lossCertainty(withPace(pace, sd))).toBeCloseTo(certainty, 12);
  });
});

describe("isLossLikelier (AC-3)", () => {
  it.each([
    [0, false],
    [0.4999999, false],
    [0.5, true],
    [0.5000001, true],
    [1, true],
  ])("of a Sicherheit of %f is %s", (certainty, likelier) => {
    expect(isLossLikelier(certainty)).toBe(likelier);
  });
});

describe("trafficLight (AC-2)", () => {
  it.each([
    ["green", "just over 80 %", -0.1 - (QUANTILE_80 + 1e-6) * 0.3],
    ["yellow", "just under 80 %", -0.1 - (QUANTILE_80 - 1e-6) * 0.3],
    ["yellow", "50 %", -0.1],
    ["yellow", "just over 20 %", -0.1 + (QUANTILE_80 - 1e-6) * 0.3],
    ["red", "just under 20 %", -0.1 + (QUANTILE_80 + 1e-6) * 0.3],
  ])(
    "is %s where the pace lies under -0.1 kg per week with %s (%f ± 0.3)",
    (light, _, pace) => {
      expect(trafficLight(withPace(pace, 0.3))).toBe(light);
    },
  );
});
