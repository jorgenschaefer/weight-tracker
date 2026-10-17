// The hook is tested where the person uses it: on the page.
import { act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_KEY } from "@/measurement/cache";
import {
  fetchMeasurements,
  type GoogleHealthResult,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";
import {
  at,
  daysAgo,
  deferred,
  FIRST_VISIT,
  failure,
  fetchButton,
  google,
  hasNoButton,
  isNotShown,
  isShown,
  leavePage,
  logoutButton,
  MORNING,
  MORNING_SHOWN,
  NOW,
  openAndClick,
  renderPage,
  standInForGoogle,
  storeCache,
  storedCache,
  storeMorning,
  TOKEN_LIFETIME_S,
} from "@/test/open-page";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
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

  it("gets the last 90 days on the first fetch and keeps them in the cache", async () => {
    google.measurements = [at(daysAgo(91), 101.0), at(daysAgo(89), 100.0)];
    await openAndClick(fetchButton);

    await waitFor(() =>
      expect(storedCache()).toEqual({
        fetchedAt: NOW,
        measurements: [at(daysAgo(89), 100.0)],
      }),
    );
  });

  it("gets the last 14 days anew, so corrections and deletions arrive, and keeps older cached ones", async () => {
    storeCache(daysAgo(1), [
      at(daysAgo(20), 99.0),
      at(daysAgo(10), 98.0),
      at(daysAgo(5), 97.0),
    ]);
    google.measurements = [at(daysAgo(20), 95.0), at(daysAgo(10), 98.4)];
    await openAndClick(fetchButton);

    await waitFor(() =>
      expect(storedCache()).toEqual({
        fetchedAt: NOW,
        measurements: [at(daysAgo(20), 99.0), at(daysAgo(10), 98.4)],
      }),
    );
  });

  it("gets everything since the last fetch where that lies further back than 14 days", async () => {
    storeCache(daysAgo(30), [at(daysAgo(40), 99.0)]);
    google.measurements = [
      at(daysAgo(40), 95.0),
      at(daysAgo(25), 98.0),
      at(daysAgo(2), 97.0),
    ];
    await openAndClick(fetchButton);

    await waitFor(() =>
      expect(storedCache()?.measurements).toEqual([
        at(daysAgo(40), 99.0),
        at(daysAgo(25), 98.0),
        at(daysAgo(2), 97.0),
      ]),
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

  it("fetches by itself, with the token it holds", async () => {
    await fetchThenWeighAgain(10);

    await comeIntoView();

    await isShown(LATER_SHOWN);
    expect(google.tokensIssued).toBe(1);
  });

  it("does not fetch again within 5 minutes of the last fetch", async () => {
    await fetchThenWeighAgain(4.9);

    await comeIntoView();

    isNotShown(LATER_SHOWN);
  });

  it("does not fetch while the page goes out of view", async () => {
    await fetchThenWeighAgain(10);

    await changeVisibility("hidden");

    isNotShown(LATER_SHOWN);
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

  it("fetches with the token up to just before it expires", async () => {
    await fetchThenWeighAgain(TOKEN_LIFETIME_S / 60 - 0.1);

    await comeIntoView();

    await isShown(LATER_SHOWN);
  });

  it("does not fetch again while a fetch still runs", async () => {
    storeMorning();
    const firstAnswer = deferred<GoogleHealthResult<Measurement[]>>();
    vi.mocked(fetchMeasurements).mockReturnValueOnce(firstAnswer.promise);
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

const comeIntoView = () => changeVisibility("visible");

/** The page goes into or out of view, as on switching tabs or apps. */
async function changeVisibility(state: DocumentVisibilityState) {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(state);
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

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
    const answer = deferred<GoogleHealthResult<Measurement[]>>();
    vi.mocked(fetchMeasurements).mockReturnValueOnce(answer.promise);
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
