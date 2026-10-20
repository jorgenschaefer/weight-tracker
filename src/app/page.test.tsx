import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_KEY } from "@/measurement/cache";
import {
  fetchMeasurements,
  revokeAccess,
  signIn,
} from "@/measurement/google-health";
import {
  at,
  daysAgo,
  FIRST_VISIT,
  failure,
  google,
  hasNoButton,
  isNotShown,
  isShown,
  leavePage,
  logOut,
  MORNING,
  MORNING_SHOWN,
  NOW,
  openAndClick,
  openHistoryOn,
  renderPage,
  signInButton,
  standInForGoogle,
  statusLine,
  steady,
  storeCache,
  storedCache,
  storeLoss,
  storeMorning,
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

const verdict = () => screen.getByRole("heading", { level: 1 });
/** The Satz zum Morgen of {@link storeLoss}. */
const LOSS_SENTENCE = "Du nimmst seit Wochen ab.";

describe("the first visit", () => {
  it("shows only the status line and the sentence of explanation", async () => {
    renderPage();

    expect(await statusLine()).toBeInTheDocument();
    expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    isNotShown(/Letzte Messung/);
    hasNoButton("Abmelden");
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

  it("offers to sign in, since this visit has no sign-in yet", async () => {
    storeMorning();
    renderPage();

    expect(await signInButton()).toBeInTheDocument();
    isNotShown(FIRST_VISIT);
  });

  it("shows the verdict from the cache at once, without Google", async () => {
    storeLoss();
    renderPage();

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      LOSS_SENTENCE,
    );
    expect(screen.getByText(/^Letzte Messung 17\.10\./)).toBeInTheDocument();
    expect(fetchMeasurements).not.toHaveBeenCalled();
  });

  it("judges on the day it is when the page comes back into view", async () => {
    storeLoss();
    renderPage();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      LOSS_SENTENCE,
    );

    vi.setSystemTime(daysAgo(-4));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(verdict()).toHaveTextContent("Letzte Messung vor 4 Tagen");
  });

  it("keeps the verdict, and signs in and fetches with one tap on ⟳", async () => {
    storeLoss();
    google.measurements = [MORNING];
    const user = renderPage();

    const button = await signInButton();
    expect(verdict()).toHaveTextContent(LOSS_SENTENCE);
    await user.click(button);

    await isShown(MORNING_SHOWN);
  });

  it("says so where the cache holds no measurement", async () => {
    storeCache(daysAgo(1), []);
    renderPage();

    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
  });

  it("has no „Abmelden“ of its own, signed in or not", async () => {
    storeMorning();
    const user = renderPage();
    await isShown(MORNING_SHOWN);
    hasNoButton("Abmelden");

    await user.click(await signInButton());

    await waitFor(() => expect(fetchMeasurements).toHaveBeenCalled());
    await statusLine();
    hasNoButton("Abmelden");
  });
});

describe("the colour of the browser around the page", () => {
  const themeColours = () =>
    Array.from(
      document.head.querySelectorAll<HTMLMetaElement>(
        'meta[name="theme-color"]',
      ),
      (meta) => meta.content,
    );

  it("is the neutral surface on the first visit", async () => {
    renderPage();
    await statusLine();

    expect(themeColours()).toEqual(["#DDE1E5"]);
  });

  it("is the surface of the verdict from the cache", async () => {
    openHistoryOn("2026-09-12");
    await statusLine();

    expect(themeColours()).toEqual(["#F2C6B8"]);
  });

  it("follows the surface when a fetch changes it, without reloading", async () => {
    google.measurements = steady("2026-10-17", 35, -0.5);
    await openAndClick(signInButton);

    await waitFor(() => expect(themeColours()).toEqual(["#D3EAD0"]));
  });
});

describe("a failed fetch", () => {
  it("shows a short error in the status line and keeps the cache", async () => {
    const cached = [MORNING];
    storeCache(daysAgo(1), cached);
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await openAndClick(signInButton);

    await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    expect(screen.getByText(MORNING_SHOWN)).toBeInTheDocument();
    expect(storedCache()).toEqual({
      fetchedAt: daysAgo(1),
      measurements: cached,
    });
    expect(await statusLine()).toContainElement(
      screen.getByText("Abruf fehlgeschlagen: Google antwortet nicht."),
    );
  });

  it("keeps the verdict from the cache", async () => {
    storeLoss();
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await openAndClick(signInButton);

    await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    expect(verdict()).toHaveTextContent(LOSS_SENTENCE);
  });

  it("explains a sign-in failing, and offers it again", async () => {
    storeMorning();
    vi.mocked(signIn).mockResolvedValueOnce(
      failure({ kind: "accessNotGranted" }),
    );
    await openAndClick(signInButton);

    await isShown(
      "Abruf fehlgeschlagen: Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.",
    );
    expect(await signInButton()).toBeInTheDocument();
  });

  it("shows the error on the first visit too, and offers to sign in again", async () => {
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));
    await openAndClick(signInButton);

    await isShown(
      "Abruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    expect(await signInButton()).toBeInTheDocument();
  });
});

describe("„Abmelden“", () => {
  it("clears the cache even where the access cannot be revoked, and says so", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    vi.mocked(revokeAccess).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );

    await logOut(user);

    await isShown("Widerruf fehlgeschlagen: Google antwortet nicht.");
    expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it("says so where Google does not revoke, and where to remove the access", async () => {
    google.measurements = [MORNING];
    const user = await openAndClick(signInButton);
    await isShown(MORNING_SHOWN);
    vi.mocked(revokeAccess).mockResolvedValueOnce(
      failure({ kind: "revokeFailed" }),
    );

    await logOut(user);

    await isShown(
      "Widerruf fehlgeschlagen: Google hat den Zugriff nicht widerrufen.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Die Seite darf deine Gewichtsmessungen weiter lesen und eintragen. Den Zugriff entfernst du in deinem Google-Konto.",
    );
    expect(
      screen.getByRole("link", { name: "deinem Google-Konto" }),
    ).toHaveAttribute("href", "https://myaccount.google.com/connections");
  });
});

describe("the button to enter a weight", () => {
  const enterButton = () =>
    screen.findByRole("button", { name: "Gewicht eintragen" });

  it("is there on the first visit, before the first fetch", async () => {
    renderPage();

    expect(await enterButton()).toBeInTheDocument();
  });

  it("is there on the page from the cache", async () => {
    storeLoss();
    renderPage();

    expect(await enterButton()).toBeInTheDocument();
  });

  it("is there after a failed fetch", async () => {
    vi.mocked(fetchMeasurements).mockResolvedValue(
      failure({ kind: "unreachable" }),
    );
    await openAndClick(signInButton);

    await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    expect(await enterButton()).toBeInTheDocument();
  });
});

describe("the layout", () => {
  it("puts the verdict and the four figures before the graph", async () => {
    storeLoss();
    renderPage();

    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend der letzten sechs Wochen",
    });
    const inOrder = [
      verdict(),
      screen.getByText("Gewicht, geschätzt", { selector: "dt" }),
      graph,
    ];
    for (const [earlier, later] of inOrder
      .slice(0, -1)
      .map((e, i) => [e, inOrder[i + 1]])) {
      expect(earlier.compareDocumentPosition(later)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
  });

  // jsdom lays nothing out, so the stylesheets are read instead.
  const stylesheets = [
    "page.module.css",
    "Verdict.module.css",
    "GoogleStatus.module.css",
  ].map((file) => readFileSync(join(import.meta.dirname, file), "utf8"));

  it("leaves room below the page for the button to enter a weight, 20 px over it, so it covers nothing scrolled to the bottom", () => {
    const surfaceRules = [
      ...stylesheets[0].matchAll(/\.surface\s*\{([^}]*)\}/g),
    ].map((match) => match[1]);

    // The button is 60 px tall, 20 px from the bottom of the window.
    expect(surfaceRules[0]).toMatch(/padding-bottom:\s*100px/);
    for (const later of surfaceRules.slice(1)) {
      expect(later).not.toMatch(/padding(-bottom)?:/);
    }
  });

  it("limits the content to 960 px, in the middle", () => {
    const content = /\.content\s*\{([^}]*)\}/.exec(stylesheets[0])?.[1];

    expect(content).toMatch(/max-width:\s*960px/);
    expect(content).toMatch(/margin-inline:\s*auto/);
  });

  it("sets nothing wider than a 360 px screen outside the wide screen, but the limit", () => {
    const narrow = stylesheets.map((css) =>
      css
        .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "")
        .replace(/max-width:\s*960px/, ""),
    );
    const lengths = narrow.flatMap((css) =>
      [...css.matchAll(/(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1])),
    );

    expect(lengths.length).toBeGreaterThan(0);
    expect(lengths.filter((px) => px > 360)).toEqual([]);
  });
});
