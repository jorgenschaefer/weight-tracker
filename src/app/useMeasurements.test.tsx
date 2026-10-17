// The hook is tested where the person uses it: on the page.
import { waitFor } from "@testing-library/react";
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
  standInForGoogle,
  storeCache,
  storedCache,
  storeMorning,
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
