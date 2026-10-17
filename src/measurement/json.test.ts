import { describe, expect, it } from "vitest";
import { isRecord, parseJson } from "./json";

describe("parseJson", () => {
  it("reads the value the text holds", () => {
    expect(parseJson('{"kg": 98.6}')).toEqual({ kg: 98.6 });
  });

  it("gives null for text that is no JSON", () => {
    expect(parseJson("{kg")).toBeNull();
  });
});

describe("isRecord", () => {
  it("holds for an object", () => {
    expect(isRecord({})).toBe(true);
  });

  it.each([null, [], "{}", 1])("does not hold for %j", (value) => {
    expect(isRecord(value)).toBe(false);
  });
});
