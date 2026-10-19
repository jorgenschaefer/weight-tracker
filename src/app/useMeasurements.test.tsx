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
  changeVisibility,
  comeIntoView,
  daysAgo,
  ENTERED_SHOWN,
  enterWeight,
  FIRST_VISIT,
  failure,
  fetchButton,
  google,
  hasNoButton,
  holdFetch,
  isNotShown,
  isShown,
  leavePage,
  logoutButton,
  MORNING,
  MORNING_SHOWN,
  NOT_YET_FETCHED,
  NOW,
  openAndClick,
  renderPage,
  sheet,
  standInForGoogle,
  steady,
  storeCache,
  storedCache,
  storeMorning,
  TOKEN_LIFETIME_S,
} from "@/test/open-page";

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
    await openAndClick(fetchButton);

    await isShown(MORNING_SHOWN);
    expect(storedCache()?.measurements).toEqual(google.measurements);
  });
});

describe("fetching", () => {
  it("signs in and fetches with one click, and shows the measurement from Google Health", async () => {
    google.measurements = [MORNING];
    await openAndClick(fetchButton);

    await isShown(MORNING_SHOWN);
    hasNoButton("Daten abrufen");
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
    await openAndClick(fetchButton);

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
    await openAndClick(fetchButton);
    await isShown(MORNING_SHOWN);
    google.measurements = [MORNING, LATER];
    vi.setSystemTime(new Date(NOW.getTime() + minutes * 60_000));
  }

  it.each<[string, number, DocumentVisibilityState, boolean]>([
    ["fetches by itself, with the token it holds,", 10, "visible", true],
    [
      "fetches with the token up to just before it expires",
      TOKEN_LIFETIME_S / 60 - 0.1,
      "visible",
      true,
    ],
    [
      "does not fetch again within 5 minutes of the last fetch",
      4.9,
      "visible",
      false,
    ],
    ["does not fetch while the page goes out of view", 10, "hidden", false],
  ])("%s", async (_, minutes, state, fetches) => {
    await fetchThenWeighAgain(minutes);

    await changeVisibility(state);

    if (fetches) await isShown(LATER_SHOWN);
    else isNotShown(LATER_SHOWN);
    expect(google.tokensIssued).toBe(1);
  });

  it("does not sign in by itself where it holds no token", async () => {
    storeMorning();
    renderPage();
    await fetchButton();

    await comeIntoView();

    expect(google.tokensIssued).toBe(0);
    await fetchButton();
  });

  it("shows just the button, without asking Google, once the token has expired", async () => {
    await fetchThenWeighAgain(TOKEN_LIFETIME_S / 60);

    await comeIntoView();

    await fetchButton();
    isNotShown(/Abruf fehlgeschlagen/);
    isNotShown(LATER_SHOWN);
  });

  it("does not fetch again while a fetch still runs", async () => {
    storeMorning();
    holdFetch();
    await openAndClick(fetchButton);
    google.measurements = [MORNING, LATER];
    vi.setSystemTime(new Date(NOW.getTime() + 10 * 60_000));

    await comeIntoView();

    isNotShown(LATER_SHOWN);
    await isShown("Vorläufig, wird aktualisiert …");
  });

  it("shows the button again where Google rejects the token before it expires", async () => {
    await fetchThenWeighAgain(10);
    google.grants = [];

    await comeIntoView();

    await isShown("Abruf fehlgeschlagen: Die Anmeldung ist abgelaufen.");
    await fetchButton();
  });
});

describe("a failed fetch", () => {
  it("signs in anew on the next click where Google rejected the token", async () => {
    google.measurements = [MORNING];
    storeCache(daysAgo(1), []);
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "tokenRejected" }),
    );
    const user = await openAndClick(fetchButton);

    await user.click(await fetchButton());

    await isShown(MORNING_SHOWN);
    isNotShown(/Abruf fehlgeschlagen/);
    expect(google.tokensIssued).toBe(2);
  });
});

describe("„Abmelden“", () => {
  it("clears the cache, revokes the access and shows the first visit", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(fetchButton);

    await user.click(await logoutButton());

    await isShown(FIRST_VISIT);
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    expect(google.grants).toEqual([]);
    expect(google.tokensIssued).toBe(1);
  });

  it("discards the token, so the next fetch signs in anew", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(fetchButton);
    await user.click(await logoutButton());

    await user.click(await fetchButton());

    await isShown(MORNING_SHOWN);
    expect(google.tokensIssued).toBe(2);
  });

  it("signs in first where it has no token, to revoke the access", async () => {
    storeMorning();
    await openAndClick(logoutButton);

    await isShown(FIRST_VISIT);
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    await waitFor(() => expect(google.tokensIssued).toBe(1));
    expect(google.grants).toEqual([]);
  });

  it("signs in anew to revoke the access where its token has expired", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(fetchButton);
    await isShown(MORNING_SHOWN);
    vi.setSystemTime(new Date(NOW.getTime() + TOKEN_LIFETIME_S * 1000));

    await user.click(await logoutButton());

    await isShown(FIRST_VISIT);
    await waitFor(() => expect(google.tokensIssued).toBe(2));
    // Revoking the new token withdraws the page's access at Google.
    await waitFor(() => expect(google.grants).not.toContain("token-2"));
  });

  it("drops what a fetch still running brings back", async () => {
    storeMorning();
    const answer = holdFetch();
    const user = await openAndClick(fetchButton);

    await user.click(await logoutButton());
    answer.resolve({ ok: true, value: [MORNING] });

    await isShown(FIRST_VISIT);
    await waitFor(() => expect(google.grants).toEqual([]));
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    isNotShown(/Letzte Messung/);
    isNotShown("Wird aktualisiert …");
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
    await isShown("Noch kein Urteil");
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
      const user = await openAndClick(fetchButton);
      await enterWeight(user);
      await isShown(ENTERED_SHOWN);

      answer.resolve(earlier);

      await waitFor(() => isNotShown(/wird aktualisiert/i));
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
      const user = await openAndClick(fetchButton);
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

  it("says so where the sign-in does not allow writing, and fetches still", async () => {
    vi.mocked(signIn).mockResolvedValue(readOnlySignIn());
    google.grants = ["read"];
    google.measurements = [MORNING];
    const user = await openAndClick(fetchButton);
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
    ["Google does not answer", () => saveFails("unreachable"), 2],
    [
      "the sign-in fails",
      () => signInAnswers(failure({ kind: "signInFailed" })),
      1,
    ],
    ["the sign-in only reads", () => signInAnswers(readOnlySignIn()), 1],
  ])(
    "does not show the weight where %s, keeps „Daten abrufen“ and saves the weight on the next tap",
    async (_, fail, signIns) => {
      fail();
      const user = renderPage();

      await enterWeight(user);

      await screen.findByText(/^Speichern fehlgeschlagen/);
      expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
      expect(await fetchButton()).toBeInTheDocument();
      expect(fetchMeasurements).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Eintragen" }));
      await isShown(ENTERED_SHOWN);
      expect(google.tokensIssued).toBe(signIns);
    },
  );

  it("signs in anew on the next tap where Google rejected the sign-in the visit holds", async () => {
    vi.mocked(enterMeasurement).mockResolvedValueOnce(
      failure({ kind: "tokenRejected" }),
    );
    const user = await openAndClick(fetchButton);
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
