// The hook is tested where the person uses it: on the page.
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_KEY } from "@/measurement/cache";
import {
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthResult,
  type SignedIn,
  signIn,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";
import {
  at,
  comeIntoView,
  daysAgo,
  ENTERED_SHOWN,
  enterWeight,
  FIRST_VISIT,
  failure,
  google,
  hasNoButton,
  holdFetch,
  isNotShown,
  isShown,
  leavePage,
  logOut,
  MORNING,
  MORNING_SHOWN,
  NOT_YET_FETCHED,
  NOW,
  openAndClick,
  passTime,
  reload,
  renderPage,
  runTimersFrom,
  sheet,
  signInButton,
  standInForGoogle,
  statusDetail,
  statusMark,
  steady,
  storeCache,
  storedCache,
  storeMorning,
  TOKEN_LIFETIME_S,
} from "@/test/open-page";
import { serializeHeldToken, TOKEN_KEY } from "./held-token";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

beforeEach(() => standInForGoogle(NOW));
afterEach(leavePage);

describe("the first visit", () => {
  it("is what a cache entry that cannot be read shows, and the fetch replaces it", async () => {
    localStorage.setItem(CACHE_KEY, "{not json");
    google.measurements = [MORNING];
    await openAndClick(signInButton);

    await isShown(MORNING_SHOWN);
    expect(storedCache()?.measurements).toEqual(google.measurements);
  });

  it("is what a token entry that cannot be read shows, without fetching", async () => {
    localStorage.setItem(TOKEN_KEY, "{not json");
    renderPage();

    await signInButton();
    await isShown(FIRST_VISIT);
    expect(fetchMeasurements).not.toHaveBeenCalled();
  });
});

describe("fetching", () => {
  it("signs in and fetches with one click, and shows the measurement from Google Health", async () => {
    google.measurements = [MORNING];
    await openAndClick(signInButton);

    await isShown(MORNING_SHOWN);
    hasNoButton("Anmelden und abrufen");
  });

  it.each([
    [
      "the last 90 days on the first fetch",
      null,
      [at(daysAgo(91), 101.0), at(daysAgo(89), 100.0)],
      [at(daysAgo(89), 100.0)],
    ],
    [
      "the last 14 days anew, so corrections and deletions arrive, and keeps older cached ones",
      {
        fetchedAt: daysAgo(1),
        measurements: [
          at(daysAgo(20), 99.0),
          at(daysAgo(10), 98.0),
          at(daysAgo(5), 97.0),
        ],
      },
      [at(daysAgo(20), 95.0), at(daysAgo(10), 98.4)],
      [at(daysAgo(20), 99.0), at(daysAgo(10), 98.4)],
    ],
    [
      "everything since the last fetch where that lies further back than 14 days",
      { fetchedAt: daysAgo(30), measurements: [at(daysAgo(40), 99.0)] },
      [at(daysAgo(40), 95.0), at(daysAgo(25), 98.0), at(daysAgo(2), 97.0)],
      [at(daysAgo(40), 99.0), at(daysAgo(25), 98.0), at(daysAgo(2), 97.0)],
    ],
  ])("gets %s, into the cache", async (_, cached, inGoogle, kept) => {
    if (cached !== null) storeCache(cached.fetchedAt, cached.measurements);
    google.measurements = inGoogle;
    await openAndClick(signInButton);

    await waitFor(() =>
      expect(storedCache()).toEqual({ fetchedAt: NOW, measurements: kept }),
    );
  });
});

describe("coming back into view", () => {
  const LATER = at("2026-10-17T08:05:00Z", 98.2);
  const LATER_SHOWN = "Letzte Messung 17.10. um 10:05 Uhr: 98,2 kg";

  /** Fetches once, then weighs again in Google Health `minutes` later. */
  async function fetchThenWeighAgain(minutes: number) {
    google.measurements = [MORNING];
    await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    google.measurements = [MORNING, LATER];
    vi.setSystemTime(new Date(NOW.getTime() + minutes * 60_000));
  }

  it("does not fetch, however long ago the last fetch was", async () => {
    await fetchThenWeighAgain(TOKEN_LIFETIME_S / 60 - 0.1);

    await comeIntoView();

    isNotShown(LATER_SHOWN);
    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
    expect(await statusMark()).toBe("signedIn");
  });

  it("does not sign in by itself where it holds no token", async () => {
    storeMorning();
    renderPage();
    await signInButton();

    await comeIntoView();

    expect(google.tokensIssued).toBe(0);
    await signInButton();
  });

  // A timeout may not have run while the device slept.
  it("offers to sign in, without asking Google, once the token has expired", async () => {
    await fetchThenWeighAgain(TOKEN_LIFETIME_S / 60);

    await comeIntoView();

    await signInButton();
    isNotShown(/Abruf fehlgeschlagen/);
    isNotShown(LATER_SHOWN);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("the sign-in expiring while the page is open", () => {
  beforeEach(() => runTimersFrom(NOW));

  it("says „nicht angemeldet“ with the empty circle from that moment, without a tap or asking Google", async () => {
    google.measurements = [MORNING];
    await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);

    await passTime((TOKEN_LIFETIME_S - 1) * 1000);
    expect(await statusMark()).toBe("signedIn");
    await passTime(1000);

    await waitFor(async () =>
      expect(await statusDetail()).toBe("nicht angemeldet"),
    );
    expect(await statusMark()).toBe("signedOut");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
  });

  it("does so with the sign-in from before the open too", async () => {
    await openAndClick(signInButton);
    await statusMark();
    await passTime(10 * 60_000);
    reload();
    await waitFor(() => expect(fetchMeasurements).toHaveBeenCalledTimes(2));

    await passTime((TOKEN_LIFETIME_S - 10 * 60) * 1000);

    await waitFor(async () => expect(await statusMark()).toBe("signedOut"));
  });

  it("does not drop a newer sign-in for the one that expired", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    await logOut(user);
    await passTime(30 * 60_000);
    await user.click(await signInButton());
    await isShown(MORNING_SHOWN);

    await passTime((TOKEN_LIFETIME_S - 30 * 60) * 1000);

    expect(await statusMark()).toBe("signedIn");
  });
});

describe("opening the page again", () => {
  const LATER = at("2026-10-17T08:05:00Z", 98.2);
  const LATER_SHOWN = "Letzte Messung 17.10. um 10:05 Uhr: 98,2 kg";

  /** Fetches once, then weighs again in Google Health `minutes` later. */
  async function fetchThenWeighAgain(minutes: number) {
    google.measurements = [MORNING];
    await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    google.measurements = [MORNING, LATER];
    vi.setSystemTime(new Date(NOW.getTime() + minutes * 60_000));
  }

  it.each([
    ["at once", 10],
    ["up to just before the token expires", TOKEN_LIFETIME_S / 60 - 0.1],
  ])(
    "fetches %s with the token of the last sign-in, without signing in",
    async (_, minutes) => {
      await fetchThenWeighAgain(minutes);

      reload();

      await isShown(LATER_SHOWN);
      hasNoButton("Anmelden und abrufen");
      expect(google.tokensIssued).toBe(1);
    },
  );

  it("shows the fetch as one after a click does", async () => {
    await fetchThenWeighAgain(10);
    holdFetch();

    reload();

    await isShown("ruft ab …");
    hasNoButton("Anmelden und abrufen");
  });

  it("shows the cache and offers to sign in, without asking Google, once the token has expired", async () => {
    await fetchThenWeighAgain(TOKEN_LIFETIME_S / 60);

    reload();

    await signInButton();
    await isShown(MORNING_SHOWN);
    isNotShown(/Abruf fehlgeschlagen/);
    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("says so and offers to sign in where Google rejects the token, and does not fetch on the next open", async () => {
    await fetchThenWeighAgain(10);
    google.grants = [];
    reload();
    await isShown("Abruf fehlgeschlagen: Die Anmeldung ist abgelaufen.");
    await signInButton();

    reload();

    await signInButton();
    isNotShown(/Abruf fehlgeschlagen/);
    expect(fetchMeasurements).toHaveBeenCalledTimes(2);
  });

  it("does not fetch on the next open where Google rejected the token on „Eintragen“", async () => {
    const user = await openAndClick(signInButton);
    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
    google.grants = [];
    await enterWeight(user);
    await isShown("Speichern fehlgeschlagen: Die Anmeldung ist abgelaufen.");

    reload();

    await signInButton();
    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
  });

  it("keeps the token another tab has signed in for since, where Google rejects the old one", async () => {
    await fetchThenWeighAgain(10);
    const answer = holdFetch();
    reload();
    const newer = serializeHeldToken({
      token: "token-2",
      expiresAt: new Date(NOW.getTime() + 20 * 60_000),
      writeGranted: true,
    });
    localStorage.setItem(TOKEN_KEY, newer);

    answer.resolve(failure({ kind: "tokenRejected" }));

    await isShown("Abruf fehlgeschlagen: Die Anmeldung ist abgelaufen.");
    expect(localStorage.getItem(TOKEN_KEY)).toBe(newer);
  });
});

describe("a failed fetch", () => {
  it("signs in anew on the next click where Google rejected the token", async () => {
    google.measurements = [MORNING];
    storeCache(daysAgo(1), []);
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "tokenRejected" }),
    );
    const user = await openAndClick(signInButton);

    await user.click(await signInButton());

    await isShown(MORNING_SHOWN);
    isNotShown(/Abruf fehlgeschlagen/);
    expect(google.tokensIssued).toBe(2);
  });
});

describe("„Abmelden“", () => {
  it("clears the cache, revokes the access and shows the first visit", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);

    await logOut(user);

    await isShown(FIRST_VISIT);
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    expect(google.grants).toEqual([]);
    expect(google.tokensIssued).toBe(1);
  });

  it("discards the token, so the next fetch signs in anew", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await logOut(user);

    await user.click(await signInButton());

    await isShown(MORNING_SHOWN);
    expect(google.tokensIssued).toBe(2);
  });

  // The token expires as its timeout runs, which these tests leave unrun:
  // the moment between expiring and the timeout.
  it("signs in anew to revoke the access where its token has expired", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    vi.setSystemTime(new Date(NOW.getTime() + TOKEN_LIFETIME_S * 1000));

    await logOut(user);

    await isShown(FIRST_VISIT);
    await waitFor(() => expect(google.tokensIssued).toBe(2));
    // Revoking the new token withdraws the page's access at Google.
    await waitFor(() => expect(google.grants).not.toContain("token-2"));
  });

  it("says the revoke failed where the sign-in to revoke fails", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    vi.setSystemTime(new Date(NOW.getTime() + TOKEN_LIFETIME_S * 1000));
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));

    await logOut(user);

    await isShown(
      "Widerruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    expect(google.grants).toContain("token-1");
  });

  it("does not keep the sign-in it makes to revoke the access for the next open", async () => {
    const user = await openAndClick(signInButton);
    await statusMark();
    vi.setSystemTime(new Date(NOW.getTime() + TOKEN_LIFETIME_S * 1000));
    await logOut(user);
    await waitFor(() => expect(google.tokensIssued).toBe(2));

    reload();

    await signInButton();
    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
  });

  it("leaves the first visit to the next open, which does not fetch", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await logOut(user);
    await isShown(FIRST_VISIT);

    reload();

    await signInButton();
    await isShown(FIRST_VISIT);
    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
  });

  it("revokes the access with the token of the sign-in before the open", async () => {
    google.measurements = [MORNING];
    await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    const user = reload();
    await isShown(MORNING_SHOWN);

    await logOut(user);

    await isShown(FIRST_VISIT);
    await waitFor(() => expect(google.grants).toEqual([]));
    expect(google.tokensIssued).toBe(1);
  });

  it("drops what a fetch still running brings back", async () => {
    storeMorning();
    const answer = holdFetch();
    const user = await openAndClick(signInButton);
    await statusMark();

    await logOut(user);
    answer.resolve({ ok: true, value: [MORNING] });

    await isShown(FIRST_VISIT);
    await waitFor(() => expect(google.grants).toEqual([]));
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    isNotShown(/Letzte Messung/);
    isNotShown("ruft ab …");
  });
});

/** A sign-in where the person allowed reading and not writing. */
const readOnlySignIn = () =>
  ({
    ok: true,
    value: { token: "read", expiresInSeconds: 3599, writeGranted: false },
  }) as const;

describe("entering a weight", () => {
  const ENTERED = at(NOW, 98.6);
  it("signs in, writes the weight at this moment into Google Health, shows it at once and then fetches with the same sign-in", async () => {
    const answer = holdFetch();
    const user = renderPage();

    await enterWeight(user);

    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);
    expect(google.measurements).toEqual([ENTERED]);
    await waitFor(() => expect(sheet()).not.toBeInTheDocument());
    isNotShown(FIRST_VISIT);
    await isShown("Ob du abnimmst, ist noch offen.");
    answer.resolve({ ok: true, value: [ENTERED] });
    await isShown(ENTERED_SHOWN);
    expect(storedCache()?.measurements).toEqual([ENTERED]);
    expect(google.tokensIssued).toBe(1);
  });

  it("shows a first weight of the day as measured, in the trend and the verdict too", async () => {
    storeCache(daysAgo(1), steady("2026-10-16", 35, -0.5, 99));
    holdFetch();
    const user = renderPage();

    await enterWeight(user, "98");

    expect(await screen.findByText("Gemessen")).toBeInTheDocument();
    expect(screen.getByText("Gemessen").nextElementSibling).toHaveTextContent(
      "98,0 kg",
    );
  });

  it.each<[string, GoogleHealthResult<Measurement[]>]>([
    ["data from before the weight", { ok: true, value: [] }],
    ["a failure", failure({ kind: "unreachable" })],
  ])(
    "drops %s from a fetch still running when it starts its own",
    async (_, earlier) => {
      const answer = holdFetch();
      const user = await openAndClick(signInButton);
      await enterWeight(user);
      await isShown(ENTERED_SHOWN);

      answer.resolve(earlier);

      await waitFor(() => isNotShown("ruft ab …"));
      expect(screen.getByText(ENTERED_SHOWN)).toBeInTheDocument();
      isNotShown(/Abruf fehlgeschlagen/);
      expect(storedCache()?.measurements).toEqual([ENTERED]);
    },
  );

  it.each([
    ["may write, with it", true, TOKEN_LIFETIME_S, 0],
    ["only reads, anew", false, TOKEN_LIFETIME_S, 1],
    ["has expired, anew", true, 1, 1],
  ])(
    "signs in where the sign-in the visit holds %s",
    async (_, writeGranted, expiresInSeconds, signIns) => {
      vi.mocked(signIn).mockResolvedValueOnce({
        ok: true,
        value: { token: "held", writeGranted, expiresInSeconds },
      });
      google.grants = ["held"];
      const user = await openAndClick(signInButton);
      await isShown(
        "Noch keine Messung in Google Health in den letzten 90 Tagen",
      );
      vi.setSystemTime(NOW.getTime() + 1000);

      await enterWeight(user);

      await waitFor(() =>
        expect(google.measurements).toEqual([
          at(new Date(NOW.getTime() + 1000), 98.6),
        ]),
      );
      expect(google.tokensIssued).toBe(signIns);
    },
  );

  it.each([
    ["may write, with it", true, 0],
    ["only reads, anew", false, 1],
  ])(
    "after opening the page again, signs in where the sign-in before %s",
    async (_, writeGranted, signIns) => {
      vi.mocked(signIn).mockResolvedValueOnce({
        ok: true,
        value: { token: "held", writeGranted, expiresInSeconds: 3599 },
      });
      google.grants = ["held"];
      await openAndClick(signInButton);
      await isShown(
        "Noch keine Messung in Google Health in den letzten 90 Tagen",
      );
      const user = reload();
      await isShown(
        "Noch keine Messung in Google Health in den letzten 90 Tagen",
      );

      await enterWeight(user);

      await isShown(ENTERED_SHOWN);
      expect(google.tokensIssued).toBe(signIns);
    },
  );

  it("keeps its sign-in for the next open", async () => {
    const user = renderPage();
    await enterWeight(user);
    await isShown(ENTERED_SHOWN);

    reload();

    await waitFor(() => expect(fetchMeasurements).toHaveBeenCalledTimes(2));
    hasNoButton("Anmelden und abrufen");
    expect(google.tokensIssued).toBe(1);
  });

  it.each<[string, () => void]>([
    [
      "Google does not answer",
      () =>
        vi
          .mocked(enterMeasurement)
          .mockResolvedValueOnce(failure({ kind: "unreachable" })),
    ],
    [
      "the sign-in only reads",
      () => {
        vi.mocked(signIn).mockResolvedValueOnce(readOnlySignIn());
        google.grants = ["read"];
      },
    ],
  ])(
    "keeps its sign-in where %s on saving, fetches with it, and keeps it for the next open",
    async (_, fail) => {
      fail();
      const user = renderPage();

      await enterWeight(user);

      await screen.findByText(/^Speichern fehlgeschlagen/);
      await waitFor(() => expect(fetchMeasurements).toHaveBeenCalledTimes(1));
      expect(await statusMark()).toBe("signedIn");
      reload();
      await waitFor(() => expect(fetchMeasurements).toHaveBeenCalledTimes(2));
      expect(signIn).toHaveBeenCalledTimes(1);
    },
  );

  it("does not keep its sign-in where Google rejects it on saving", async () => {
    vi.mocked(enterMeasurement).mockResolvedValueOnce(
      failure({ kind: "tokenRejected" }),
    );
    const user = renderPage();

    await enterWeight(user);

    await isShown("Speichern fehlgeschlagen: Die Anmeldung ist abgelaufen.");
    expect(await statusMark()).toBe("signedOut");
    expect(fetchMeasurements).not.toHaveBeenCalled();
    reload();
    await signInButton();
    expect(fetchMeasurements).not.toHaveBeenCalled();
  });

  it("says so where the sign-in does not allow writing, and fetches still", async () => {
    vi.mocked(signIn).mockResolvedValue(readOnlySignIn());
    google.grants = ["read"];
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);

    await enterWeight(user);

    await isShown(
      "Speichern fehlgeschlagen: Das Speichern in Google Health wurde nicht erlaubt.",
    );
    expect(google.measurements).toEqual([MORNING]);
  });

  const saveFails = (kind: "unreachable") =>
    vi.mocked(enterMeasurement).mockResolvedValueOnce(failure({ kind }));
  const signInAnswers = (answer: GoogleHealthResult<SignedIn>) =>
    vi.mocked(signIn).mockResolvedValueOnce(answer);

  it.each<[string, () => void, number]>([
    ["Google does not answer", () => saveFails("unreachable"), 1],
    [
      "the sign-in fails",
      () => signInAnswers(failure({ kind: "signInFailed" })),
      1,
    ],
    ["the sign-in only reads", () => signInAnswers(readOnlySignIn()), 1],
  ])(
    "does not show the weight where %s, and saves it on the next tap",
    async (_, fail, signIns) => {
      fail();
      const user = renderPage();

      await enterWeight(user);

      await screen.findByText(/^Speichern fehlgeschlagen/);
      isNotShown(/Letzte Messung/);
      await user.click(screen.getByRole("button", { name: "Eintragen" }));
      await isShown(ENTERED_SHOWN);
      expect(google.tokensIssued).toBe(signIns);
    },
  );

  it("stays signed out where its sign-in fails, without fetching", async () => {
    signInAnswers(failure({ kind: "signInFailed" }));
    const user = renderPage();

    await enterWeight(user);

    await screen.findByText(/^Speichern fehlgeschlagen/);
    expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    expect(await signInButton()).toBeInTheDocument();
    expect(fetchMeasurements).not.toHaveBeenCalled();
  });

  it("signs in anew on the next tap where Google rejected the sign-in the visit holds", async () => {
    vi.mocked(enterMeasurement).mockResolvedValueOnce(
      failure({ kind: "tokenRejected" }),
    );
    const user = await openAndClick(signInButton);
    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
    await enterWeight(user);
    await isShown("Speichern fehlgeschlagen: Die Anmeldung ist abgelaufen.");

    await user.click(screen.getByRole("button", { name: "Eintragen" }));

    await isShown(ENTERED_SHOWN);
    expect(google.tokensIssued).toBe(2);
  });
});
