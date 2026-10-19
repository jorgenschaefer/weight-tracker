import { describe, expect, it } from "vitest";
import { parseEnteredKg } from "./entered-measurement";

describe("parseEnteredKg", () => {
  it("takes a weight with a decimal comma", () => {
    expect(parseEnteredKg("98,6")).toBe(98.6);
  });

  it.each([
    ["98.6", 98.6],
    ["98", 98],
    ["30", 30],
    ["250", 250],
    ["250,0", 250],
    ["30.0", 30],
    [" 98,6 ", 98.6],
  ])("takes %j as %d kg", (input, kg) => {
    expect(parseEnteredKg(input)).toBe(kg);
  });
});

describe("parseEnteredKg refuses", () => {
  it.each([
    "",
    "   ",
    "29,9",
    "250,1",
    "0",
    "-98",
    "98,65",
    "98,",
    ",5",
    "98,6 kg",
    "98.6.1",
    "9 8",
    "1e2",
    "0x62",
    "abc",
  ])("%j", (input) => {
    expect(parseEnteredKg(input)).toBeNull();
  });
});
