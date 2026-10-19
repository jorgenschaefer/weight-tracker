import { describe, expect, it } from "vitest";
import { notYetFetched, parseEnteredKg } from "./entered-measurement";

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

const ENTERED = { time: new Date("2026-10-17T07:57:00.000Z"), kg: 98.6 };
const at = (time: string, kg: number) => ({ time: new Date(time), kg });

describe("notYetFetched", () => {
  it("keeps an entered measurement the fetch does not hold", () => {
    expect(notYetFetched([ENTERED], [])).toEqual([ENTERED]);
  });

  it.each([
    ["the same measurement", at("2026-10-17T07:57:00.000Z", 98.6)],
    ["a minute later", at("2026-10-17T07:58:00.000Z", 98.6)],
    ["a minute earlier", at("2026-10-17T07:56:00.000Z", 98.6)],
    ["in grams that round to it", at("2026-10-17T07:57:00.000Z", 98.649)],
    ["in grams that round up to it", at("2026-10-17T07:57:00.000Z", 98.55)],
  ])("drops an entered measurement the fetch holds as %s", (_, fetched) => {
    expect(notYetFetched([ENTERED], [fetched])).toEqual([]);
  });

  it.each([
    ["more than a minute later", at("2026-10-17T07:58:00.001Z", 98.6)],
    ["more than a minute earlier", at("2026-10-17T07:55:59.999Z", 98.6)],
    ["0.1 kg heavier", at("2026-10-17T07:57:00.000Z", 98.7)],
    [
      "in grams that round to 0.1 kg less",
      at("2026-10-17T07:57:00.000Z", 98.549),
    ],
  ])(
    "keeps an entered measurement where the fetch holds one %s",
    (_, fetched) => {
      expect(notYetFetched([ENTERED], [fetched])).toEqual([ENTERED]);
    },
  );

  it("keeps the entered measurements the fetch does not hold, and only those", () => {
    const later = at("2026-10-17T09:00:00.000Z", 98.4);

    expect(notYetFetched([ENTERED, later], [ENTERED])).toEqual([later]);
  });
});
