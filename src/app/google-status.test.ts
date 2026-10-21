import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  type GoogleState,
  lastFetch,
  signedInUntil,
  statusLine,
} from "./google-status";

const TODAY = "2026-10-20" as CalendarDay;

/** Between a time and „Uhr“, which never break apart. */
const NBSP = "\u00a0";

const IDLE: GoogleState = {
  signedIn: false,
  signingIn: false,
  savingKg: null,
  fetching: null,
  fetchFailure: null,
  fetchedAt: null,
};

describe("statusLine", () => {
  it("says „nicht angemeldet“ with the empty circle where the page is not signed in", () => {
    expect(statusLine(IDLE, TODAY)).toMatchObject({
      mark: "signedOut",
      detail: "nicht angemeldet",
    });
  });

  it("says when the last fetch was, by its time alone where it was on the day the page judges on, with the filled dot", () => {
    const fetchedAt = new Date("2026-10-20T07:14:00+02:00");

    expect(
      statusLine({ ...IDLE, signedIn: true, fetchedAt }, TODAY),
    ).toMatchObject({
      mark: "signedIn",
      detail: `abgerufen 7:14${NBSP}Uhr`,
    });
  });

  it.each([
    [
      "the day before",
      "2026-10-19T22:10:00+02:00",
      `abgerufen 19.10. um 22:10${NBSP}Uhr`,
    ],
    [
      "just before midnight in Berlin",
      "2026-10-19T23:59:00+02:00",
      `abgerufen 19.10. um 23:59${NBSP}Uhr`,
    ],
    [
      "at midnight in Berlin",
      "2026-10-20T00:00:00+02:00",
      `abgerufen 0:00${NBSP}Uhr`,
    ],
    [
      "in the winter time of a year before",
      "2025-12-24T18:30:00+01:00",
      `abgerufen 24.12. um 18:30${NBSP}Uhr`,
    ],
  ])("says the day too where the last fetch was %s", (_, fetched, detail) => {
    const fetchedAt = new Date(fetched);

    expect(
      statusLine({ ...IDLE, signedIn: true, fetchedAt }, TODAY).detail,
    ).toBe(detail);
  });

  it("says „noch nicht abgerufen“ before the first fetch that succeeded", () => {
    expect(statusLine({ ...IDLE, signedIn: true }, TODAY)).toMatchObject({
      mark: "signedIn",
      detail: "noch nicht abgerufen",
    });
  });

  it.each<[string, Partial<GoogleState>, string]>([
    ["„ruft ab …“ while a fetch runs", { fetching: "first" }, "ruft ab …"],
    [
      "„ruft ältere Messungen ab …“ while a fetch gets the older measurements",
      { fetching: "older" },
      "ruft ältere Messungen ab …",
    ],
    [
      "„speichert <Gewicht> kg …“ while an entry waits on Google",
      { savingKg: 84.1 },
      "speichert 84,1 kg …",
    ],
    [
      "„meldet an …“ while a sign-in popup is open",
      { signingIn: true },
      "meldet an …",
    ],
  ])("says %s, with the mark of the sign-in", (_, running, detail) => {
    expect(statusLine({ ...IDLE, ...running }, TODAY)).toMatchObject({
      mark: "signedOut",
      detail,
    });
    expect(
      statusLine({ ...IDLE, signedIn: true, ...running }, TODAY),
    ).toMatchObject({
      mark: "signedIn",
      detail,
    });
  });

  it.each([false, true])(
    "says why the fetch failed, with the exclamation mark, signed in: %s",
    (signedIn) => {
      const fetchFailure = { kind: "unreachable" } as const;

      expect(
        statusLine({ ...IDLE, signedIn, fetchFailure }, TODAY),
      ).toMatchObject({
        mark: "failed",
        detail: "Abruf fehlgeschlagen: Google antwortet nicht.",
      });
    },
  );

  const FAILED = { kind: "unreachable" } as const;
  const EVERYTHING: GoogleState = {
    signedIn: true,
    signingIn: true,
    savingKg: 84.1,
    fetching: "first",
    fetchFailure: FAILED,
    fetchedAt: new Date("2026-10-20T07:14:00+02:00"),
  };

  it.each<[Partial<GoogleState>, string]>([
    [{}, "meldet an …"],
    [{ signingIn: false }, "speichert 84,1 kg …"],
    [{ signingIn: false, savingKg: null }, "ruft ab …"],
    [
      { signingIn: false, savingKg: null, fetching: null },
      "Abruf fehlgeschlagen: Google antwortet nicht.",
    ],
    [
      {
        signingIn: false,
        savingKg: null,
        fetching: null,
        fetchFailure: null,
        signedIn: false,
      },
      "nicht angemeldet",
    ],
  ])("takes the first that applies, of %o: %s", (left, detail) => {
    expect(statusLine({ ...EVERYTHING, ...left }, TODAY).detail).toBe(detail);
  });

  it.each<[Partial<GoogleState>, boolean]>([
    [{ signingIn: true }, true],
    [{ savingKg: 84.1 }, true],
    [{ fetching: "first" }, true],
    [{ fetching: "older" }, true],
    [{ fetchFailure: FAILED }, false],
    [{ signedIn: true, fetchedAt: new Date() }, false],
    [{}, false],
  ])("counts %o as running: %s", (state, busy) => {
    expect(statusLine({ ...IDLE, ...state }, TODAY).busy).toBe(busy);
  });
});

describe("signedInUntil", () => {
  const expiresAt = new Date("2026-10-20T10:59:00+02:00");

  it("says until when the page is signed in", () => {
    expect(signedInUntil({ expiresAt, writeGranted: true })).toBe(
      `Angemeldet bis 10:59${NBSP}Uhr`,
    );
  });

  it("adds „, nur Lesen“ where the sign-in does not allow entering", () => {
    expect(signedInUntil({ expiresAt, writeGranted: false })).toBe(
      `Angemeldet bis 10:59${NBSP}Uhr, nur Lesen`,
    );
  });
});

describe("lastFetch", () => {
  it.each([
    [
      "on the day the page judges on",
      "2026-10-20T07:14:00+02:00",
      `Abgerufen 7:14${NBSP}Uhr`,
    ],
    [
      "the day before",
      "2026-10-19T22:10:00+02:00",
      `Abgerufen 19.10. um 22:10${NBSP}Uhr`,
    ],
  ])(
    "says when the last fetch was, %s, with a capital A",
    (_, fetched, said) => {
      expect(lastFetch(new Date(fetched), TODAY)).toBe(said);
    },
  );

  it("says „Noch nicht abgerufen“ before the first fetch", () => {
    expect(lastFetch(null, TODAY)).toBe("Noch nicht abgerufen");
  });
});
