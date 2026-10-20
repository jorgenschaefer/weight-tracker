import { describe, expect, it } from "vitest";
import { kcalPerDay } from "./pace";

describe("kcalPerDay", () => {
  // 7700 kcal per kg, over the 7 days of a week, rounded to the nearest ten.
  it.each([
    [-0.388, 430],
    [0.388, 430],
    [-0.466, 510],
    [0.291, 320],
    [-4.1, 4510],
    [0.0045, 0],
    [0.005, 10],
    [0, 0],
  ])("is %d kg per week as %d kcal a day", (kgPerWeek, kcal) => {
    expect(kcalPerDay(kgPerWeek)).toBe(kcal);
  });
});
