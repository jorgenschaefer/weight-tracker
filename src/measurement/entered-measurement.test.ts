import { describe, expect, it } from "vitest";
import {
  enteredAfterFetch,
  parseEnteredKg,
  parseEnteredMeasurements,
  serializeEnteredMeasurements,
} from "./entered-measurement";
import type { Measurement } from "./measurement";

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

/**
 * When a fetch starts that drops nothing for its age: three minutes after
 * {@link ENTERED}, so only what it holds decides.
 */
const SOON = new Date("2026-10-17T08:00:00.000Z");

/** The entered measurements left after a fetch starting at {@link SOON}. */
const leftSoonAfter = (entered: Measurement[], fetched: Measurement[]) =>
  enteredAfterFetch(entered, fetched, SOON);

describe("enteredAfterFetch, soon after entering", () => {
  it("keeps an entered measurement the fetch does not hold", () => {
    expect(leftSoonAfter([ENTERED], [])).toEqual([ENTERED]);
  });

  it.each([
    ["the same measurement", at("2026-10-17T07:57:00.000Z", 98.6)],
    ["a minute later", at("2026-10-17T07:58:00.000Z", 98.6)],
    ["a minute earlier", at("2026-10-17T07:56:00.000Z", 98.6)],
    ["in grams that round to it", at("2026-10-17T07:57:00.000Z", 98.649)],
    ["in grams that round up to it", at("2026-10-17T07:57:00.000Z", 98.55)],
  ])("drops an entered measurement the fetch holds as %s", (_, fetched) => {
    expect(leftSoonAfter([ENTERED], [fetched])).toEqual([]);
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
      expect(leftSoonAfter([ENTERED], [fetched])).toEqual([ENTERED]);
    },
  );

  // `later` is entered after the fetch started, as in another tab while this
  // one fetches: the hour counts from entering, so it stays.
  it("keeps the entered measurements the fetch does not hold, and only those", () => {
    const later = at("2026-10-17T09:00:00.000Z", 98.4);

    expect(leftSoonAfter([ENTERED, later], [ENTERED])).toEqual([later]);
  });
});

describe("enteredAfterFetch, by when the fetch starts", () => {
  it.each([
    [
      "keeps",
      "just under an hour after",
      "2026-10-17T08:56:59.999Z",
      [ENTERED],
    ],
    ["drops", "an hour after", "2026-10-17T08:57:00.000Z", []],
    ["drops", "a day after", "2026-10-18T07:57:00.000Z", []],
  ])(
    "%s an entered measurement the fetch does not hold where it starts %s entering it",
    (_, __, startedAt, left) => {
      expect(enteredAfterFetch([ENTERED], [], new Date(startedAt))).toEqual(
        left,
      );
    },
  );

  it("drops only those entered an hour or more before it starts", () => {
    const later = at("2026-10-17T09:00:00.000Z", 98.4);
    const startedAt = new Date("2026-10-17T09:30:00.000Z");

    expect(enteredAfterFetch([ENTERED, later], [], startedAt)).toEqual([later]);
  });
});

describe("the stored form of the entered measurements", () => {
  it("is a list of times as ISO text and weights in kg", () => {
    expect(serializeEnteredMeasurements([ENTERED])).toBe(
      '[{"time":"2026-10-17T07:57:00.000Z","kg":98.6}]',
    );
  });

  it("reads back as what was stored", () => {
    const later = at("2026-10-17T09:00:00.000Z", 98.4);
    const stored = serializeEnteredMeasurements([ENTERED, later]);

    expect(parseEnteredMeasurements(stored)).toEqual([ENTERED, later]);
  });

  it.each([
    ["is missing", null],
    ["is empty", "[]"],
    ["is not JSON", "[{"],
    ["is not a list", '{"time":"2026-10-17T07:57:00.000Z","kg":98.6}'],
    [
      "holds a weight that is not a number",
      '[{"time":"2026-10-17T07:57:00.000Z","kg":"98,6"}]',
    ],
    [
      "holds a time not written as ISO text",
      '[{"time":"2026-10-17 07:57","kg":98.6}]',
    ],
    ["holds something that is no measurement", "[42]"],
  ])("reads as none where the entry %s", (_, stored) => {
    expect(parseEnteredMeasurements(stored)).toEqual([]);
  });
});
