import { describe, expect, it } from "vitest";
import { formatDay, formatKg, formatTime } from "./format";

describe("formatKg", () => {
  it.each([
    [99.7, "99,7"],
    [98.599, "98,6"],
    [100, "100,0"],
    [99.95, "100,0"],
    [64.04, "64,0"],
  ])("writes %d kg as %s, with a decimal comma and one decimal", (kg, text) => {
    expect(formatKg(kg)).toBe(text);
  });
});

describe("formatDay", () => {
  it("writes the day and month without leading zeros", () => {
    expect(formatDay(new Date("2026-08-05T05:00:00Z"))).toBe("5.8.");
  });

  it("writes the Berlin day, which after 22:00 UTC in summer is the next", () => {
    expect(formatDay(new Date("2026-10-16T22:30:00Z"))).toBe("17.10.");
  });

  it("writes the Berlin day in winter, an hour ahead of UTC", () => {
    expect(formatDay(new Date("2026-12-31T23:30:00Z"))).toBe("1.1.");
  });
});

describe("formatTime", () => {
  it("writes the Berlin time of day, the hour without a leading zero", () => {
    expect(formatTime(new Date("2026-10-17T05:12:00Z"))).toBe("7:12");
  });

  it("writes the time after midnight as 0 hours", () => {
    expect(formatTime(new Date("2026-10-16T22:05:00Z"))).toBe("0:05");
  });

  it("follows Berlin across the switch to winter time", () => {
    expect(formatTime(new Date("2026-10-25T06:00:00Z"))).toBe("7:00");
  });
});
