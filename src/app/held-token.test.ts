import { describe, expect, it } from "vitest";
import {
  type HeldToken,
  hasExpired,
  held,
  maySave,
  parseHeldToken,
  serializeHeldToken,
} from "./held-token";

const NOW = new Date("2026-10-17T08:00:00.000Z");
const later = (ms: number) => new Date(NOW.getTime() + ms);

const token = (writeGranted: boolean): HeldToken => ({
  token: "token-1",
  expiresAt: later(3599_000),
  writeGranted,
});

describe("held", () => {
  it("holds the token of a sign-in until its lifetime from now has passed", () => {
    expect(
      held(
        {
          ok: true,
          value: {
            token: "token-1",
            expiresInSeconds: 3599,
            writeGranted: true,
          },
        },
        NOW,
      ),
    ).toEqual({ ok: true, value: token(true) });
  });

  it("passes on a failed sign-in", () => {
    const failed = { ok: false, error: { kind: "signInFailed" } } as const;
    expect(held(failed, NOW)).toEqual(failed);
  });
});

describe("hasExpired", () => {
  it.each([
    ["not just before its expiry", 3599_000 - 1, false],
    ["at its expiry", 3599_000, true],
  ])("is %s", (_, ms, expired) => {
    expect(hasExpired(token(true), later(ms))).toBe(expired);
  });
});

describe("maySave", () => {
  it.each<[string, HeldToken | null, number, boolean]>([
    ["a token that may write", token(true), 0, true],
    ["a token that only reads", token(false), 0, false],
    ["an expired token", token(true), 3599_000, false],
    ["no token", null, 0, false],
  ])("for %s is %s", (_, heldToken, ms, may) => {
    expect(maySave(heldToken, later(ms))).toBe(may);
  });
});

describe("the stored form", () => {
  it("holds the token, its expiry as ISO time and whether it may write", () => {
    expect(JSON.parse(serializeHeldToken(token(false)))).toEqual({
      token: "token-1",
      expiresAt: "2026-10-17T08:59:59.000Z",
      writeGranted: false,
    });
  });

  it.each([true, false])(
    "is read back as the token it stores, writeGranted %s",
    (writeGranted) => {
      expect(parseHeldToken(serializeHeldToken(token(writeGranted)))).toEqual(
        token(writeGranted),
      );
    },
  );

  const stored = { token: "token-1", expiresAt: "2026-10-17T08:59:59.000Z" };
  it.each([
    ["missing", null],
    ["no JSON", "{not json"],
    ["not an object", "[]"],
    ["without the token", { ...stored, token: undefined, writeGranted: true }],
    [
      "with a token that is no text",
      { ...stored, token: 1, writeGranted: true },
    ],
    ["with an empty token", { ...stored, token: "", writeGranted: true }],
    ["without whether it may write", stored],
    [
      "with a „writeGranted“ that is no truth value",
      { ...stored, writeGranted: "true" },
    ],
    [
      "with an expiry that is no time",
      { ...stored, expiresAt: "bald", writeGranted: true },
    ],
    [
      "with an expiry that is no ISO time",
      { ...stored, expiresAt: "2026-10-17", writeGranted: true },
    ],
  ])("is no token where the entry is %s", (_, entry) => {
    expect(
      parseHeldToken(
        entry === null || typeof entry === "string"
          ? entry
          : JSON.stringify(entry),
      ),
    ).toBeNull();
  });
});
