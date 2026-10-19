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
  NOW,
  openAndClick,
  renderPage,
  standInForGoogle,
  steady,
  storeCache,
  storedCache,
  storeLoss,
  storeMorning,
} from "@/test/open-page";
import { weightHistory } from "@/test/weight-history-fixture";

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
const verdictSection = () => verdict().closest("section");

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
});

describe("opening the page with a cache", () => {
  it("turns the button to fetch around on the surface, so it stands out on every level", async () => {
    const august30 = new Date("2026-08-30T18:00:00+02:00");
    vi.setSystemTime(august30);
    storeCache(
      august30,
      weightHistory().filter((m) => m.time <= august30),
    );
    renderPage();

    const button = await fetchButton();
    expect(screen.getByRole("main")).toHaveStyle({
      backgroundColor: "#8A380A",
    });
    expect(button.style.getPropertyValue("--button-bg")).toBe("#FFF3E8");
    expect(button.style.getPropertyValue("--button-color")).toBe("#8A380A");
  });

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

  it("shows the verdict from the cache at once, without Google", async () => {
    storeLoss();
    renderPage();

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Nimmt ab",
    );
    expect(screen.getByText(/^Letzte Messung 17\.10\./)).toBeInTheDocument();
    expect(fetchMeasurements).not.toHaveBeenCalled();
  });

  it("judges on the day it is when the page comes back into view", async () => {
    storeLoss();
    renderPage();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Nimmt ab",
    );

    vi.setSystemTime(daysAgo(-4));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(verdict()).toHaveTextContent("Letzte Messung vor 4 Tagen");
  });

  it("offers the button at the verdict, which stays, and fetches with one click", async () => {
    storeLoss();
    google.measurements = [MORNING];
    const user = renderPage();

    const button = await fetchButton();
    expect(verdictSection()).toContainElement(button);
    expect(verdict()).toHaveTextContent("Nimmt ab");
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

  it("puts „Abmelden“ at the bottom", async () => {
    storeMorning();
    renderPage();

    expect(await logoutButton()).toBeInTheDocument();
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
    await fetchButton();

    expect(themeColours()).toEqual(["#DDE1E5"]);
  });

  it("is the surface of the verdict from the cache", async () => {
    const august30 = new Date("2026-08-30T18:00:00+02:00");
    vi.setSystemTime(august30);
    storeCache(
      august30,
      weightHistory().filter((m) => m.time <= august30),
    );
    renderPage();
    await fetchButton();

    expect(themeColours()).toEqual(["#8A380A"]);
  });

  it("follows the surface when a fetch changes it, without reloading", async () => {
    google.measurements = steady("2026-10-17", 35, -0.5);
    await openAndClick(fetchButton);

    await waitFor(() => expect(themeColours()).toEqual(["#D5E4F1"]));
  });
});

describe("fetching", () => {
  it("marks the verdict from the cache provisional while the fetch runs, and not after", async () => {
    storeLoss();
    const answer = holdFetch();
    await openAndClick(fetchButton);

    await isShown("Vorläufig, wird aktualisiert …");
    expect(verdictSection()).toHaveAttribute("aria-busy", "true");
    expect(verdict()).toHaveTextContent("Nimmt ab");
    hasNoButton("Daten abrufen");
    answer.resolve({ ok: true, value: [] });
    await waitFor(() => isNotShown(/wird aktualisiert/i));
    expect(verdictSection()).toHaveAttribute("aria-busy", "false");
  });

  it("shows „Wird aktualisiert …“ on the first visit too", async () => {
    holdFetch();
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
    isNotShown(/wird aktualisiert/i);
  });

  it("keeps the verdict from the cache, the error right under „Letzte Messung“", async () => {
    storeLoss();
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await openAndClick(fetchButton);

    const error = await screen.findByText(
      "Abruf fehlgeschlagen: Google antwortet nicht.",
    );
    expect(verdict()).toHaveTextContent("Nimmt ab");
    expect(error.previousElementSibling).toHaveTextContent(/^Letzte Messung/);
  });

  it("explains a sign-in failing, and offers it again", async () => {
    storeMorning();
    vi.mocked(signIn).mockResolvedValueOnce(
      failure({ kind: "accessNotGranted" }),
    );
    await openAndClick(fetchButton);

    await isShown(
      "Abruf fehlgeschlagen: Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.",
    );
    expect(await fetchButton()).toBeInTheDocument();
  });

  it("shows the error on the first visit too, with the button to try again", async () => {
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));
    await openAndClick(fetchButton);

    await isShown(
      "Abruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    expect(await fetchButton()).toBeInTheDocument();
  });
});

describe("„Abmelden“", () => {
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
    await openAndClick(fetchButton);

    await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    expect(await enterButton()).toBeInTheDocument();
  });
});

describe("the layout", () => {
  it("puts the verdict, „Langfristig“ and the figures before the graph", async () => {
    storeLoss();
    renderPage();

    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend der letzten sechs Wochen",
    });
    const inOrder = [
      verdict(),
      screen.getByText("Langfristig · 4 Wochen"),
      screen.getByText("Trend", { selector: "dt" }),
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
  const stylesheets = ["page.module.css", "Verdict.module.css"].map((file) =>
    readFileSync(join(import.meta.dirname, file), "utf8"),
  );

  it("dims the headline of a verdict marked provisional", () => {
    const provisional = /\.verdict\[aria-busy="true"\] h1\s*\{([^}]*)\}/.exec(
      stylesheets[0],
    )?.[1];

    expect(provisional).toMatch(/opacity:\s*0\.45/);
  });

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
