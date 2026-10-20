import { describe, expect, it } from "vitest";
import { type HeldToken, hasExpired, held, maySave } from "./held-token";

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
