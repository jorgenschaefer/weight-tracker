import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_KEY, parseCache, serializeCache } from "@/measurement/cache";
import {
  fetchMeasurements,
  type GoogleHealthError,
  type GoogleHealthResult,
  revokeAccess,
  signIn,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";
import Page from "./page";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

const NOW = new Date("2026-10-17T08:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);
const at = (time: string | Date, kg: number): Measurement => ({
  time: new Date(time),
  kg,
});

/**
 * Google, in memory: the measurements in Google Health and the access
 * tokens it has granted the page and not yet revoked.
 */
let google: { measurements: Measurement[]; grants: string[] };
let tokensIssued: number;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  localStorage.clear();
  google = { measurements: [], grants: [] };
  tokensIssued = 0;

  vi.mocked(signIn).mockImplementation(async () => {
    const token = `token-${++tokensIssued}`;
    google.grants.push(token);
    return { ok: true, value: token };
  });
  vi.mocked(fetchMeasurements).mockImplementation(async (token, from) => {
    if (!google.grants.includes(token))
      return failure({ kind: "tokenRejected" });
    return {
      ok: true,
      value: google.measurements.filter((m) => m.time >= from),
    };
  });
  vi.mocked(revokeAccess).mockImplementation(async (token) => {
    google.grants = google.grants.filter((t) => t !== token);
    return { ok: true, value: null };
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function failure(error: GoogleHealthError): {
  ok: false;
  error: GoogleHealthError;
} {
  return { ok: false, error };
}

function storeCache(fetchedAt: Date, measurements: Measurement[]) {
  localStorage.setItem(CACHE_KEY, serializeCache({ fetchedAt, measurements }));
}

const storedCache = () => parseCache(localStorage.getItem(CACHE_KEY));

function renderPage() {
  render(
    <MantineProvider>
      <Page />
    </MantineProvider>,
  );
  return userEvent.setup();
}

/** Opens the page and clicks `button`; returns the user to click on with. */
async function openAndClick(button: () => Promise<HTMLElement>) {
  const user = renderPage();
  await user.click(await button());
  return user;
}

const fetchButton = () =>
  screen.findByRole("button", { name: "Daten abrufen" });
const logoutButton = () => screen.findByRole("button", { name: "Abmelden" });

/** One measurement, and how „Letzte Messung“ shows it. */
const MORNING = at("2026-10-17T07:57:00Z", 98.599);
const MORNING_SHOWN = "Letzte Messung 17.10. um 9:57 Uhr: 98,6 kg";

/** A cache from yesterday's fetch, holding {@link MORNING}. */
const storeMorning = () => storeCache(daysAgo(1), [MORNING]);

const isShown = async (text: string) =>
  expect(await screen.findByText(text)).toBeInTheDocument();

const isNotShown = (text: string | RegExp) =>
  expect(screen.queryByText(text)).not.toBeInTheDocument();

const hasNoButton = (name: string) =>
  expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();

const FIRST_VISIT =
  "Diese Seite liest deine Gewichtsmessungen aus Google Health und zeigt dir, ob du noch abnimmst.";

/** A promise to hold a call with, settled by the test. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("the first visit", () => {
  it("shows only the sentence of explanation and the button", async () => {
    renderPage();

    expect(await fetchButton()).toBeInTheDocument();
    expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    isNotShown(/Letzte Messung/);
    hasNoButton("Abmelden");
  });

  it("writes the button in the surface's colour, as the design does", async () => {
    renderPage();

    expect((await fetchButton()).style.getPropertyValue("--button-color")).toBe(
      "#DDE1E5",
    );
  });

  it("is what a cache entry that cannot be read shows, and the fetch replaces it", async () => {
    localStorage.setItem(CACHE_KEY, "{not json");
    google.measurements = [MORNING];
    await openAndClick(fetchButton);

    await isShown(MORNING_SHOWN);
    expect(storedCache()?.measurements).toEqual(google.measurements);
  });
});

describe("opening the page with a cache", () => {
  it("shows the latest measurement from the cache at once, without Google", async () => {
    storeCache(daysAgo(1), [
      at("2026-10-16T05:10:00Z", 98.3),
      at("2026-10-17T07:57:00Z", 98.599),
    ]);
    renderPage();

    await isShown(MORNING_SHOWN);
    expect(fetchMeasurements).not.toHaveBeenCalled();
  });

  it("shows the newest measurement even where it does not count", async () => {
    storeCache(daysAgo(1), [
      at("2026-08-05T05:00:00Z", 99.7),
      at("2026-08-05T17:30:00Z", 100.4),
    ]);
    renderPage();

    await isShown("Letzte Messung 5.8. um 19:30 Uhr: 100,4 kg");
  });

  it("offers the button to fetch, since this visit has no sign-in yet", async () => {
    storeMorning();
    renderPage();

    expect(await fetchButton()).toBeInTheDocument();
    isNotShown(FIRST_VISIT);
  });

  it("says so where the cache holds no measurement", async () => {
    storeCache(daysAgo(1), []);
    renderPage();

    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
  });

  it("puts „Abmelden“ at the bottom", async () => {
    storeMorning();
    renderPage();

    expect(await logoutButton()).toBeInTheDocument();
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

  it("shows „Wird aktualisiert …“ while the fetch runs, and not after", async () => {
    storeMorning();
    const answer = deferred<GoogleHealthResult<Measurement[]>>();
    vi.mocked(fetchMeasurements).mockReturnValueOnce(answer.promise);
    await openAndClick(fetchButton);

    await isShown("Wird aktualisiert …");
    hasNoButton("Daten abrufen");
    answer.resolve({ ok: true, value: [] });
    await waitFor(() =>
      expect(screen.queryByText("Wird aktualisiert …")).not.toBeInTheDocument(),
    );
  });

  it("shows „Wird aktualisiert …“ on the first visit too", async () => {
    vi.mocked(fetchMeasurements).mockReturnValueOnce(new Promise(() => {}));
    await openAndClick(fetchButton);

    await isShown("Wird aktualisiert …");
  });
});

describe("a failed fetch", () => {
  it("shows a short error next to the latest measurement and keeps the cache", async () => {
    const cached = [MORNING];
    storeCache(daysAgo(1), cached);
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await openAndClick(fetchButton);

    await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    expect(screen.getByText(MORNING_SHOWN)).toBeInTheDocument();
    expect(storedCache()).toEqual({
      fetchedAt: daysAgo(1),
      measurements: cached,
    });
    isNotShown("Wird aktualisiert …");
  });

  it.each<[GoogleHealthError, string]>([
    [{ kind: "unreachable" }, "Google antwortet nicht."],
    [{ kind: "failed", status: 503 }, "Google meldet den Fehler 503."],
    [{ kind: "unexpectedResponse" }, "Google antwortet unerwartet."],
    [{ kind: "tokenRejected" }, "Die Anmeldung ist abgelaufen."],
  ])("explains a fetch failing with %o: %s", async (error, reason) => {
    storeMorning();
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(failure(error));
    await openAndClick(fetchButton);

    await isShown(`Abruf fehlgeschlagen: ${reason}`);
  });

  it.each<[GoogleHealthError, string]>([
    [{ kind: "signInFailed" }, "Die Anmeldung bei Google wurde abgebrochen."],
    [
      { kind: "accessNotGranted" },
      "Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.",
    ],
    [
      { kind: "signInUnavailable" },
      "Die Anmeldung bei Google ist nicht geladen.",
    ],
  ])(
    "explains a sign-in failing with %o, and offers it again",
    async (error, reason) => {
      storeMorning();
      vi.mocked(signIn).mockResolvedValueOnce(failure(error));
      await openAndClick(fetchButton);

      await isShown(`Abruf fehlgeschlagen: ${reason}`);
      expect(await fetchButton()).toBeInTheDocument();
    },
  );

  it("shows the error on the first visit too, with the button to try again", async () => {
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));
    await openAndClick(fetchButton);

    await isShown(
      "Abruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    expect(await fetchButton()).toBeInTheDocument();
  });

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
    expect(tokensIssued).toBe(2);
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
    expect(tokensIssued).toBe(1);
  });

  it("discards the token, so the next fetch signs in anew", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(fetchButton);
    await user.click(await logoutButton());

    await user.click(await fetchButton());

    await isShown(MORNING_SHOWN);
    expect(tokensIssued).toBe(2);
  });

  it("signs in first where it has no token, to revoke the access", async () => {
    storeMorning();
    await openAndClick(logoutButton);

    await isShown(FIRST_VISIT);
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    await waitFor(() => expect(tokensIssued).toBe(1));
    expect(google.grants).toEqual([]);
  });

  it("clears the cache even where the access cannot be revoked, and says so", async () => {
    storeMorning();
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));
    await openAndClick(logoutButton);

    await isShown(
      "Widerruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it("says so where Google does not revoke, and where to remove the access", async () => {
    storeMorning();
    vi.mocked(revokeAccess).mockResolvedValueOnce(
      failure({ kind: "revokeFailed" }),
    );
    await openAndClick(logoutButton);

    await isShown(
      "Widerruf fehlgeschlagen: Google hat den Zugriff nicht widerrufen.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Die Seite darf deine Gewichtsmessungen weiter lesen. Den Zugriff entfernst du in deinem Google-Konto.",
    );
    expect(
      screen.getByRole("link", { name: "deinem Google-Konto" }),
    ).toHaveAttribute("href", "https://myaccount.google.com/connections");
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
