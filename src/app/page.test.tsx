import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_KEY } from "@/measurement/cache";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import {
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthResult,
  revokeAccess,
  signIn,
} from "@/measurement/google-health";
import {
  countingMeasurements,
  type Measurement,
} from "@/measurement/measurement";
import {
  at,
  comeIntoView,
  daysAgo,
  enterWeight,
  evening,
  FIRST_VISIT,
  failure,
  google,
  HINT,
  hasNoButton,
  holdFetch,
  holdSignIn,
  isNotShown,
  isShown,
  leavePage,
  logOut,
  MORNING,
  MORNING_SHOWN,
  NOW,
  openAndClick,
  openEntrySheet,
  openHistoryOn,
  openOn,
  refreshButton,
  reload,
  renderPage,
  sheet,
  signInButton,
  standInForGoogle,
  statusDetail,
  statusLine,
  steady,
  storeCache,
  storedCache,
  storeLoss,
  storeMorning,
} from "@/test/open-page";
import { weightHistoryUntil } from "@/test/weight-history-fixture";
import { windowUpTo } from "@/trend/graph-window/graph-window";
import { windowSeries } from "@/trend/graph-window/window-series";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

beforeEach(() => standInForGoogle(NOW));
afterEach(leavePage);

/** What a screen reader is told the graph is. */
const GRAPH = "Messungen und Trend, 6 Wochen, Bis heute";

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

  /** Each brings the first visit to a state of the status line. */
  const notSignedIn = {
    "not signed in": async () => {
      renderPage();
      await isShown("nicht angemeldet");
    },
    "while signing in": async () => {
      holdSignIn();
      await openAndClick(signInButton);
      await isShown("meldet an …");
    },
    "after a declined sign-in": async () => {
      vi.mocked(signIn).mockResolvedValueOnce(
        failure({ kind: "signInFailed" }),
      );
      await openAndClick(signInButton);
      await isShown(
        "Abruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
      );
    },
  };
  const signedIn = {
    "while fetching": async () => {
      holdFetch();
      await openAndClick(signInButton);
      await isShown("ruft ab …");
    },
    "after a failed fetch": async () => {
      vi.mocked(fetchMeasurements).mockResolvedValueOnce(
        failure({ kind: "unreachable" }),
      );
      await openAndClick(signInButton);
      await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    },
  };

  it.each(Object.entries({ ...notSignedIn, ...signedIn }))(
    "shows the sentence about the page, %s",
    async (_, reach) => {
      await reach();

      expect(screen.getByText(FIRST_VISIT)).toBeInTheDocument();
    },
  );

  it.each(Object.entries(notSignedIn))(
    "shows the hint to tap the line below the sentence, %s",
    async (_, reach) => {
      await reach();

      expect(
        screen
          .getByText(FIRST_VISIT)
          .compareDocumentPosition(screen.getByText(HINT)),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );

  // Signed in, a tap on the line opens its sheet rather than signing in.
  it.each(Object.entries(signedIn))(
    "has no hint to tap the line, %s",
    async (_, reach) => {
      await reach();

      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    },
  );

  it("has no „Daten abrufen“", async () => {
    renderPage();
    await statusLine();

    expect(
      screen.queryByRole("button", { name: "Daten abrufen" }),
    ).not.toBeInTheDocument();
  });
});

describe("the rest of the page while a fetch runs", () => {
  it("stays as it is, nothing provisional or dimmed", async () => {
    storeLoss();
    holdFetch();
    await openAndClick(signInButton);

    await waitFor(async () => expect(await statusDetail()).toBe("ruft ab …"));
    isNotShown(/aktualisiert/);
    expect(verdict()).toHaveTextContent(LOSS_SENTENCE);
    expect(verdict().closest("[aria-busy]")).toBeNull();
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

describe("the suggestion in the field „Gewicht heute“", () => {
  it("is the Letzte Messung, even where it does not count", async () => {
    storeCache(daysAgo(1), [
      at("2026-08-05T05:00:00Z", 99.7),
      at("2026-08-05T17:30:00Z", 100.4),
    ]);
    const field = await openEntrySheet(renderPage());

    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", "100,4");
  });

  it("is the weight just entered, before a fetch has returned it", async () => {
    storeMorning();
    holdFetch();
    const user = renderPage();
    await enterWeight(user, "97,2");
    await waitFor(() => expect(sheet()).not.toBeInTheDocument());

    const field = await openEntrySheet(user);

    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", "97,2");
  });

  it("is 68,9 on the first visit, without any measurement", async () => {
    const field = await openEntrySheet(renderPage());

    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", "68,9");
  });
});

describe("the layout", () => {
  it("puts the verdict and the four figures before the graph", async () => {
    storeLoss();
    renderPage();

    const graph = await screen.findByRole("img", {
      name: GRAPH,
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

  // The wide screen sets the four figures beside that column, from its top.
  it("puts „Letzte Messung“ and the verdict in one column, the four figures beside it", async () => {
    storeLoss();
    renderPage();

    const figures = (await screen.findByText("Gewicht, geschätzt")).closest(
      "dl",
    );
    const column = figures?.previousElementSibling;

    expect(column).toContainElement(screen.getByText(/^Letzte Messung /));
    expect(column).toContainElement(verdict());
  });

  // jsdom lays nothing out, so the stylesheets are read instead.
  const stylesheets = [
    "page.module.css",
    "Verdict.module.css",
    "GoogleStatus.module.css",
    "ShownDayBand.module.css",
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

  /** The declarations of `selector` in `css`, outside any media query. */
  const rule = (css: string, selector: string) =>
    new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`).exec(
      css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, ""),
    )?.[1];
  /** The declarations of `selector` on the wide screen, from 65em. */
  const wideRule = (css: string, selector: string) =>
    rule(
      /@media \(min-width: 65em\) \{([\s\S]*)\}/.exec(css)?.[1] ?? "",
      selector,
    );
  const [pageCss, verdictCss, statusCss, bandCss] = stylesheets;

  it("makes „Zurück zu heute“ in the band of an earlier day at least 48 px tall", () => {
    expect(rule(bandCss, ".back")).toMatch(/min-height:\s*48px/);
  });

  // The status line is its two lines of 14 and 13 px, the 1 px between them
  // and 5 px above and below (GoogleStatus.module.css): 52.85 px, more than
  // its 48 px least height. The band takes its place without moving the page.
  it("makes the band of an earlier day as tall as the status line", () => {
    expect(rule(statusCss, ".text")).toMatch(
      /gap:\s*1px;[\s\S]*padding:\s*5px 0/,
    );
    expect(rule(bandCss, ".band")).toMatch(
      /min-height:\s*calc\(\(14px \+ 13px\) \* var\(--mantine-line-height\) \+ 11px\)/,
    );
  });

  it("keeps „Stand <day>“ and „Zurück zu heute“ in one line", () => {
    expect(rule(bandCss, ".day")).toMatch(/white-space:\s*nowrap/);
    expect(rule(bandCss, ".back")).toMatch(/white-space:\s*nowrap/);
  });

  it("keeps the band of an earlier day as wide as the content on the wide screen, as the status line", () => {
    expect(wideRule(bandCss, ".band")).toBeUndefined();
  });

  it("sets the four figures on the wide screen without a line or a gap over them", () => {
    const figures = wideRule(verdictCss, ".figures");

    expect(figures).toMatch(/padding-top:\s*0/);
    expect(figures).toMatch(/border-top:\s*none/);
  });

  it("sets „X % sicher, dass du abnimmst“ right under „Letzte Messung“ on the phone", () => {
    const shortScreen = /@media \(max-height: 45em\) \{([\s\S]*?)\n\}/.exec(
      verdictCss,
    )?.[1];

    expect(rule(verdictCss, ".line")).toMatch(/margin:\s*0;/);
    expect(shortScreen).not.toMatch(/\.line\b/);
  });

  // Set at the bottom, the verdict would stand lower by as much as the four
  // figures beside it are taller.
  it("sets „X % sicher, dass du abnimmst“ right under „Letzte Messung“ on the wide screen", () => {
    const summary = wideRule(pageCss, ".summary");

    expect(summary).not.toMatch(/margin-top/);
    expect(summary).toMatch(/align-items:\s*start/);
    expect(wideRule(verdictCss, ".line")).not.toMatch(/margin/);
  });

  // The verdict's column flows as blocks, so that the alert's gap and the
  // 28 px over „Noch kein Urteil“ collapse into one.
  it("keeps „Widerruf fehlgeschlagen …“ 28 px off the verdict under it", () => {
    expect(rule(pageCss, ".problem")).toMatch(/margin-bottom:\s*28px/);
    expect(rule(pageCss, ".verdict") ?? "").not.toMatch(/display:\s*flex/);
  });

  // In the column of the verdict on the wide screen, as the four figures
  // start their column.
  it("sets „Letzte Messung“ no farther from the status line than the four figures", () => {
    expect(rule(pageCss, ".latest")).not.toMatch(/margin/);
    expect(rule(pageCss, ".summary")).toMatch(/margin-top:\s*8px/);
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

describe("the span", () => {
  const graph = () =>
    screen.findByRole("img", { name: /^Messungen und Trend/ });
  const spanToggle = () => screen.queryByRole("group", { name: "Zeitraum" });
  const spanButton = (name: string) => screen.findByRole("button", { name });
  /** The labels under the graph, of days or months. */
  const timeLabels = async () =>
    [...(await graph()).querySelectorAll("text")]
      .map((label) => label.textContent)
      .filter((label) => !/^\d+$/.test(label ?? ""));
  /** How many points the graph draws. */
  const pointCount = async () =>
    (await graph()).querySelectorAll("circle").length;
  const todayLine = async () =>
    (await graph()).querySelector("line[stroke-dasharray]");
  /** How many days from `first` to `last`, both included, the test data has. */
  const daysWithData = (first: string, last: string) =>
    countingMeasurements(weightHistoryUntil(last)).filter(
      (measurement) => measurement.day >= first,
    ).length;

  it("opens on „6 Wochen“, beside „3 Monate“ and „1 Jahr“", async () => {
    openHistoryOn("2026-10-20");

    await graph();
    const buttons = within(spanToggle() as HTMLElement).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "6 Wochen",
      "3 Monate",
      "1 Jahr",
    ]);
    expect(
      buttons.map((button) => button.getAttribute("aria-pressed")),
    ).toEqual(["true", "false", "false"]);
  });

  it("stands above the graph, under the four figures", async () => {
    openHistoryOn("2026-10-20");

    const drawing = await graph();
    const toggle = spanToggle() as HTMLElement;
    expect(
      screen
        .getByText("Gewicht, geschätzt", { selector: "dt" })
        .compareDocumentPosition(toggle),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(toggle.compareDocumentPosition(drawing)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("fills the span chosen in the text colour of the surface, its name in the surface's colour", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await spanButton("3 Monate"));

    const main = screen.getByRole("main");
    const chosen = await spanButton("3 Monate");
    expect(chosen.style.backgroundColor).toBe(main.style.color);
    expect(chosen.style.color).toBe(main.style.backgroundColor);
    expect((await spanButton("6 Wochen")).style.backgroundColor).toBe("");
  });

  it("shows on „6 Wochen“ the 42 days up to today, with no line for today", async () => {
    openHistoryOn("2026-10-20");

    expect(await pointCount()).toBe(daysWithData("2026-09-09", "2026-10-20"));
    expect(await timeLabels()).toEqual(["17.9.", "27.9.", "7.10.", "17.10."]);
    expect(await todayLine()).toBeNull();
  });

  it("shows on „3 Monate“ this month and the two before, named, the rest of this month empty behind a line for today", async () => {
    const user = openHistoryOn("2026-10-20");

    await user.click(await spanButton("3 Monate"));

    expect(await spanButton("3 Monate")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await spanButton("6 Wochen")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(await pointCount()).toBe(daysWithData("2026-08-01", "2026-10-20"));
    expect(await timeLabels()).toEqual(["Aug", "Sep", "Okt"]);
    expect(await todayLine()).not.toBeNull();
  });

  it("shows on „1 Jahr“ the calendar year, every second month named on a phone, behind a line for today", async () => {
    const user = openHistoryOn("2026-10-20");

    await user.click(await spanButton("1 Jahr"));

    expect(await pointCount()).toBe(daysWithData("2026-01-01", "2026-10-20"));
    expect(await timeLabels()).toEqual([
      "Jan",
      "Mär",
      "Mai",
      "Jul",
      "Sep",
      "Nov",
    ]);
    expect(await todayLine()).not.toBeNull();
  });

  it("shows on „6 Wochen“ again the graph it opened with", async () => {
    const user = openHistoryOn("2026-10-20");
    const opened = (await graph()).outerHTML;

    await user.click(await spanButton("1 Jahr"));
    await user.click(await spanButton("6 Wochen"));

    expect((await graph()).outerHTML).toBe(opened);
  });

  it("is „6 Wochen“ again once the page is opened anew", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await spanButton("1 Jahr"));

    reload();

    expect(await spanButton("6 Wochen")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await todayLine()).toBeNull();
  });

  it("moves with today onto a new month as the page comes back into view", async () => {
    const user = openHistoryOn("2026-10-31", "2026-10-20");
    await user.click(await spanButton("3 Monate"));
    expect(await timeLabels()).toEqual(["Aug", "Sep", "Okt"]);

    vi.setSystemTime(evening("2026-11-01"));
    await comeIntoView();

    expect(await spanButton("3 Monate")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await timeLabels()).toEqual(["Sep", "Okt", "Nov"]);
  });

  it("is not there without any measurement", async () => {
    storeCache(daysAgo(1), []);
    renderPage();

    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
    expect(spanToggle()).toBeNull();
  });

  it("is not there on the first visit", async () => {
    renderPage();

    await isShown(FIRST_VISIT);
    expect(spanToggle()).toBeNull();
  });
});

describe("the window", () => {
  const graph = () =>
    screen.findByRole("img", { name: /^Messungen und Trend/ });
  const spanButton = (name: string) => screen.findByRole("button", { name });
  const earlier = () => screen.findByRole("button", { name: "Früher" });
  const later = () => screen.findByRole("button", { name: "Später" });
  /** How many points the graph draws. */
  const pointCount = async () =>
    (await graph()).querySelectorAll("circle").length;
  /** How many days from `first` to `last`, both included, the test data has. */
  const daysWithData = (first: string, last: string) =>
    countingMeasurements(weightHistoryUntil(last)).filter(
      (measurement) => measurement.day >= first,
    ).length;

  it("goes back with ‹ by 42 days on „6 Wochen“, and forward with › to today", async () => {
    const user = openHistoryOn("2026-10-20");

    await user.click(await earlier());

    await isShown("29.7.26 – 8.9.26");
    expect(await pointCount()).toBe(daysWithData("2026-07-29", "2026-09-08"));

    await user.click(await later());

    await isShown("Bis heute");
    expect(await pointCount()).toBe(daysWithData("2026-09-09", "2026-10-20"));
  });

  it("on switching the span takes the last day of the window: its 3 months, its 42 days, its year", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await earlier());

    await user.click(await spanButton("3 Monate"));
    await isShown("Jul – Sep 2026");
    expect(await pointCount()).toBe(daysWithData("2026-07-01", "2026-09-30"));

    await user.click(await spanButton("6 Wochen"));
    await isShown("20.8.26 – 30.9.26");

    await user.click(await spanButton("1 Jahr"));
    await isShown("2026");
    expect(await later()).toHaveAttribute("aria-disabled", "true");
  });

  it("on switching the span from a window that holds today takes today", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await spanButton("1 Jahr"));

    await user.click(await spanButton("6 Wochen"));

    await isShown("Bis heute");
  });

  it("shows with › the window up to today where the next would hold today", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await earlier());
    await user.click(await spanButton("3 Monate"));
    await isShown("Jul – Sep 2026");

    await user.click(await later());

    await isShown("Aug – Okt 2026");
    expect(await later()).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps an earlier window as the day changes", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await earlier());

    vi.setSystemTime(evening("2026-10-21"));
    await comeIntoView();

    await isShown("29.7.26 – 8.9.26");
  });

  it("says „Keine Messung in diesem Zeitraum“ in place of the graph for a window without a measurement, under the toggle, range and arrows", async () => {
    const user = openHistoryOn("2026-10-20", "2026-07-31");

    const empty = await screen.findByText("Keine Messung in diesem Zeitraum");
    expect(
      screen.queryByRole("img", { name: /^Messungen und Trend/ }),
    ).toBeNull();
    expect(await spanButton("6 Wochen")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const above of [
      screen.getByRole("group", { name: "Zeitraum" }),
      screen.getByText("Bis heute"),
      await earlier(),
      await later(),
    ])
      expect(above.compareDocumentPosition(empty)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );

    await user.click(await earlier());

    expect(await pointCount()).toBe(daysWithData("2026-07-29", "2026-07-31"));
  });

  it("stands between the toggle and the graph", async () => {
    openHistoryOn("2026-10-20");

    const drawing = await graph();
    const range = screen.getByText("Bis heute");
    expect(
      screen
        .getByRole("group", { name: "Zeitraum" })
        .compareDocumentPosition(range),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(range.compareDocumentPosition(drawing)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("tells a screen reader the span and the range of the graph", async () => {
    const user = openHistoryOn("2026-10-20");
    expect(await graph()).toHaveAccessibleName(
      "Messungen und Trend, 6 Wochen, Bis heute",
    );

    await user.click(await spanButton("1 Jahr"));

    expect(await graph()).toHaveAccessibleName(
      "Messungen und Trend, 1 Jahr, 2026",
    );
  });

  it("has no arrows without any measurement", async () => {
    storeCache(daysAgo(1), []);
    renderPage();

    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
    hasNoButton("Früher");
    hasNoButton("Später");
  });

  it("does not say „Keine Messung in diesem Zeitraum“ without any measurement", async () => {
    storeCache(daysAgo(1), []);
    renderPage();

    await isShown(
      "Noch keine Messung in Google Health in den letzten 90 Tagen",
    );
    isNotShown("Keine Messung in diesem Zeitraum");
  });

  it("tells a screen reader the range ‹ and › move to", async () => {
    const user = openHistoryOn("2026-10-20");

    await user.click(await earlier());

    await isShown("29.7.26 – 8.9.26");
    const announced = screen
      .getAllByRole("status")
      .find((status) => status.textContent === "29.7.26 – 8.9.26");
    expect(announced).toHaveAttribute("aria-live", "polite");
  });

  it("keeps the focus on ‹ as it locks", async () => {
    const user = openHistoryOn("2026-10-20");
    const button = await earlier();
    button.focus();

    await user.keyboard("{Enter}{Enter}");

    await isShown("17.6.26 – 28.7.26");
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps the focus on › as it locks", async () => {
    const user = openHistoryOn("2026-10-20");
    await user.click(await earlier());
    const button = await later();
    button.focus();

    await user.keyboard("{Enter}");

    await isShown("Bis heute");
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("locks › while the window holds today", async () => {
    const user = openHistoryOn("2026-10-20");

    expect(await later()).toHaveAttribute("aria-disabled", "true");
    expect(await earlier()).toHaveAttribute("aria-disabled", "false");

    await user.click(await later());

    await isShown("Bis heute");
  });

  it.each([
    ["6 Wochen", 2, "17.6.26 – 28.7.26"],
    ["3 Monate", 1, "Mai – Jul 2026"],
    ["1 Jahr", 0, "2026"],
  ])(
    "locks ‹ on „%s“ once the window starts on or before 1.7., the first counting measurement, %i back",
    async (span, back, range) => {
      const user = openHistoryOn("2026-10-20");
      await user.click(await spanButton(span));

      for (let i = 0; i < back; i++) await user.click(await earlier());

      await isShown(range);
      expect(await earlier()).toHaveAttribute("aria-disabled", "true");

      await user.click(await earlier());

      await isShown(range);
    },
  );
});

describe("an earlier day", () => {
  const graph = () => screen.findByRole("img", { name: GRAPH });
  /** „Stand <day>“ in the band, not in what a screen reader is told. */
  const band = () =>
    screen.queryByText(/^Stand /, { ignore: "script, style, [role=status]" });
  const backToToday = () =>
    screen.findByRole("button", { name: "Zurück zu heute" });

  /**
   * Where the point of `day` lies across the graph of the page opened in the
   * evening of `today` with the test data up to `lastDay`.
   */
  async function xOf(day: string, today = "2026-10-20", lastDay = today) {
    const { measurements } = windowSeries(
      countingMeasurements(weightHistoryUntil(lastDay)),
      windowUpTo("sixWeeks", today as CalendarDay),
    );
    const i = measurements.findIndex(
      ({ measurement }) => measurement.day === day,
    );
    const point = (await graph()).querySelectorAll("circle")[i];
    return Number(point.getAttribute("cx"));
  }

  /** A tap into the graph `x` px from its left edge. */
  async function tapAt(user: UserEvent, x: number) {
    await user.pointer({
      keys: "[MouseLeft]",
      target: await graph(),
      coords: { clientX: x },
    });
  }

  const tapOn = async (user: UserEvent, day: string, today?: string) =>
    tapAt(user, await xOf(day, today));

  /** What the page shows above the graph, and the colours around it. */
  async function aboveTheGraph() {
    await graph();
    const main = screen.getByRole("main");
    return {
      latest: screen.getByText(/^Letzte Messung /).textContent,
      verdict: verdict().parentElement?.textContent,
      figures: screen.getByText("Gemessen", { selector: "dt" }).closest("dl")
        ?.textContent,
      surface: main.style.backgroundColor,
      ink: main.style.color,
      themeColour: document.head
        .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.getAttribute("content"),
    };
  }

  const figure = (label: string) =>
    screen.getByText(label, { selector: "dt" }).nextElementSibling?.textContent;

  describe("chosen in the graph", () => {
    it("by a tap on its point, shows the page as it was on that day", async () => {
      openHistoryOn("2026-10-18");
      const onThatDay = await aboveTheGraph();
      cleanup();
      const user = openHistoryOn("2026-10-20");
      const today = await aboveTheGraph();

      await tapOn(user, "2026-10-18");

      expect(await aboveTheGraph()).toEqual(onThatDay);
      expect(onThatDay).not.toEqual(today);
      expect(figure("Gemessen")).toBe("98,4 kg");
      expect(verdict()).toHaveTextContent(
        "Achtung, die Abnahme wird langsamer.",
      );
    });

    it("names the newest measurement up to that day as „Letzte Messung“, counting or not", async () => {
      const user = openOn(
        "2026-10-20",
        weightHistoryUntil("2026-10-20", [
          { time: new Date("2026-10-18T19:30:00+02:00"), kg: 99.1 },
        ]),
      );

      await tapOn(user, "2026-10-18");

      await isShown("Letzte Messung 18.10. um 19:30 Uhr: 99,1 kg");
      expect(figure("Gemessen")).toBe("98,4 kg");
    });

    it("by a tap in a gap, shows the day whose point lies nearest across", async () => {
      const user = openHistoryOn("2026-10-20");
      const before = await xOf("2026-09-22");
      const after = await xOf("2026-10-01");

      await tapAt(user, before + (after - before) / 3);

      expect(band()).toHaveTextContent("Stand 22.9.");
      expect(figure("Gemessen")).toBe("99,4 kg");
    });

    it("by dragging over it, shows each nearest day in turn", async () => {
      const user = openHistoryOn("2026-10-20");
      const target = await graph();
      const [x18, x16, x14] = [
        await xOf("2026-10-18"),
        await xOf("2026-10-16"),
        await xOf("2026-10-14"),
      ];

      await user.pointer({
        keys: "[MouseLeft>]",
        target,
        coords: { clientX: x18 },
      });
      expect(band()).toHaveTextContent("Stand 18.10.");
      await user.pointer({ target, coords: { clientX: x16 + 1 } });
      expect(band()).toHaveTextContent("Stand 16.10.");
      await user.pointer({ target, coords: { clientX: x14 } });
      expect(band()).toHaveTextContent("Stand 14.10.");
      await user.pointer({ keys: "[/MouseLeft]", target });

      expect(band()).toHaveTextContent("Stand 14.10.");
      expect(figure("Gemessen")).toBe("97,4 kg");
    });

    it("shows nothing new where the mouse moves over the graph unpressed", async () => {
      const user = openHistoryOn("2026-10-20");
      const target = await graph();

      await user.pointer({
        target,
        coords: { clientX: await xOf("2026-10-14") },
      });

      expect(band()).toBeNull();
    });

    describe("by touch", () => {
      it("by a tap with a finger", async () => {
        const user = openHistoryOn("2026-10-20");

        await user.pointer({
          keys: "[TouchA]",
          target: await graph(),
          coords: { clientX: await xOf("2026-10-18"), clientY: 100 },
        });

        expect(band()).toHaveTextContent("Stand 18.10.");
      });

      it("by dragging a finger across, each nearest day in turn", async () => {
        const user = openHistoryOn("2026-10-20");
        const target = await graph();
        const x18 = await xOf("2026-10-18");
        const x14 = await xOf("2026-10-14");

        await user.pointer([
          { keys: "[TouchA>]", target, coords: { clientX: x18, clientY: 100 } },
          {
            pointerName: "TouchA",
            target,
            coords: { clientX: x14, clientY: 102 },
          },
        ]);

        expect(band()).toHaveTextContent("Stand 14.10.");
      });

      it("not while a finger swipes up or down, not even before the page scrolls", async () => {
        const user = openHistoryOn("2026-10-20");
        const target = await graph();
        const x = await xOf("2026-10-07");

        await user.pointer([
          { keys: "[TouchA>]", target, coords: { clientX: x, clientY: 100 } },
          {
            pointerName: "TouchA",
            target,
            coords: { clientX: x + 2, clientY: 80 },
          },
        ]);

        expect(band()).toBeNull();
        fireEvent.pointerCancel(target);
        expect(band()).toBeNull();
      });
    });

    it("is not chosen by a swipe the browser takes over to scroll", async () => {
      const user = openHistoryOn("2026-10-20");
      const target = await graph();
      await tapOn(user, "2026-10-18");

      await user.pointer({
        keys: "[MouseLeft>]",
        target,
        coords: { clientX: await xOf("2026-10-07") },
      });
      fireEvent.pointerCancel(target);

      expect(band()).toHaveTextContent("Stand 18.10.");
      expect(figure("Gemessen")).toBe("98,4 kg");
    });

    it("by a tap on the point of the last day with a measurement, is no earlier day", async () => {
      const user = openHistoryOn("2026-10-21", "2026-10-20");
      await graph();

      await tapOn(user, "2026-10-20", "2026-10-21");

      expect(band()).toBeNull();
      expect(await statusLine()).toBeInTheDocument();
    });
  });

  describe("shown", () => {
    it("has a band „Stand <day>“ with „Zurück zu heute“ in place of the status line and ⟳", async () => {
      const user = openHistoryOn("2026-10-20");

      await tapOn(user, "2026-10-18");

      expect(band()).toHaveTextContent("Stand 18.10.");
      expect(await backToToday()).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Google Health/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: /^(Abrufen|Anmelden und abrufen)$/,
        }),
      ).not.toBeInTheDocument();
    });

    it("sets the band in the text colour of the surface of that day", async () => {
      const user = openHistoryOn("2026-10-20");

      await tapOn(user, "2026-10-18");

      const { ink, surface } = await aboveTheGraph();
      const bar = band()?.parentElement;
      expect(bar?.style.backgroundColor).toBe(ink);
      expect(bar?.style.color).toBe(surface);
    });

    it("announces the band politely", async () => {
      const user = openHistoryOn("2026-10-20");

      await tapOn(user, "2026-10-18");

      const announced = screen
        .getAllByRole("status")
        .find((status) => status.textContent?.startsWith("Stand"));
      expect(announced).toHaveTextContent("Stand 18.10.");
      expect(announced).toHaveAttribute("aria-live", "polite");
    });

    it("keeps drawing the six weeks up to today with all their measurements", async () => {
      const user = openHistoryOn("2026-10-20");
      const before = [...(await graph()).querySelectorAll("circle")].map(
        (point) => point.outerHTML,
      );

      await tapOn(user, "2026-10-18");

      const after = [...(await graph()).querySelectorAll("circle")].map(
        (point) => point.outerHTML,
      );
      expect(after.slice(0, before.length)).toEqual(before);
    });
  });

  describe("back to today", () => {
    /** The page on 20.10. as it is before any day is chosen. */
    async function untouched() {
      openHistoryOn("2026-10-20");
      const page = {
        above: await aboveTheGraph(),
        graph: (await graph()).outerHTML,
      };
      cleanup();
      return page;
    }

    const isToday = async (page: Awaited<ReturnType<typeof untouched>>) => {
      expect(band()).toBeNull();
      expect(await statusLine()).toBeInTheDocument();
      expect(await refreshButton()).toBeInTheDocument();
      expect(await aboveTheGraph()).toEqual(page.above);
      expect((await graph()).outerHTML).toBe(page.graph);
    };

    it("with „Zurück zu heute“", async () => {
      const page = await untouched();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await user.click(await backToToday());

      await isToday(page);
    });

    it("with a second tap on the point shown", async () => {
      const page = await untouched();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await tapOn(user, "2026-10-18");

      await isToday(page);
    });

    it("with a tap on the point of the last day with a measurement", async () => {
      const page = await untouched();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await tapOn(user, "2026-10-20");

      await isToday(page);
    });

    it("with Escape on the graph", async () => {
      const page = await untouched();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await user.keyboard("{Escape}");

      await isToday(page);
    });

    // jsdom has no :focus-visible; what the page asks of the browser is all
    // a test can see.
    it.each([
      [
        "a tap",
        false,
        (user: UserEvent, button: HTMLElement) => user.click(button),
      ],
      [
        "the keyboard",
        true,
        async (user: UserEvent, button: HTMLElement) => {
          button.focus();
          await user.keyboard("{Enter}");
        },
      ],
    ])(
      "rings the graph in focus after „Zurück zu heute“ by %s: %s",
      async (_, ringed, press) => {
        const user = openHistoryOn("2026-10-20");
        await tapOn(user, "2026-10-18");
        const focus = vi.spyOn(await graph(), "focus");

        await press(user, await backToToday());

        expect(focus).toHaveBeenCalledWith({ focusVisible: ringed });
      },
    );

    it("puts the focus on the graph after „Zurück zu heute“", async () => {
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await user.click(await backToToday());

      expect(await graph()).toHaveFocus();
    });

    it("when the page comes back into view", async () => {
      const page = await untouched();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await comeIntoView();

      await isToday(page);
    });

    it("when the page is opened again", async () => {
      const page = await untouched();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      reload();

      await isToday(page);
    });
  });

  describe("with + while chosen", () => {
    /** How the sheet to enter a weight looks: its colours and suggestion. */
    async function entrySheet(user: UserEvent) {
      const field = await openEntrySheet(user);
      return {
        border: field.style.getPropertyValue("--input-bd"),
        suggestion: field.getAttribute("placeholder"),
        button: screen
          .getByRole("button", { name: "Eintragen" })
          .style.getPropertyValue("--button-bg"),
      };
    }

    const enterButton = () =>
      screen.findByRole("button", { name: "Gewicht eintragen" });

    /** The colours of +. */
    async function enterButtonColours() {
      const { style } = await enterButton();
      return [
        style.getPropertyValue("--ai-bg"),
        style.getPropertyValue("--ai-color"),
      ];
    }

    it("keeps + in the colours of the day shown", async () => {
      openHistoryOn("2026-10-18");
      const onThatDay = await enterButtonColours();
      cleanup();
      const user = openHistoryOn("2026-10-20");
      const today = await enterButtonColours();
      await tapOn(user, "2026-10-18");

      expect(await enterButtonColours()).toEqual(onThatDay);
      expect(onThatDay).not.toEqual(today);
    });

    it("opens the sheet of today, in its colours and with its Letzte Messung", async () => {
      const today = await entrySheet(openHistoryOn("2026-10-20"));
      cleanup();
      const onThatDay = await entrySheet(openHistoryOn("2026-10-18"));
      cleanup();
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      const chosen = await entrySheet(user);

      expect(chosen).toEqual(today);
      expect(chosen).not.toEqual(onThatDay);
    });

    it("enters for today, and shows today once entered", async () => {
      google.measurements = weightHistoryUntil("2026-10-20");
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await enterWeight(user, "97,2");

      await waitFor(() => expect(band()).toBeNull());
      expect(await statusLine()).toBeInTheDocument();
      expect(google.measurements.at(-1)).toEqual(
        at(evening("2026-10-20"), 97.2),
      );
      await isShown("Letzte Messung 20.10. um 18:00 Uhr: 97,2 kg");
    });

    it("keeps the day chosen where entering fails", async () => {
      vi.mocked(enterMeasurement).mockResolvedValueOnce(
        failure({ kind: "unreachable" }),
      );
      google.measurements = weightHistoryUntil("2026-10-20");
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");

      await enterWeight(user, "97,2");

      await isShown("Speichern fehlgeschlagen: Google antwortet nicht.");
      expect(band()).toHaveTextContent("Stand 18.10.");
    });

    it("keeps the day chosen where the sheet closes without entering", async () => {
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-18");
      await openEntrySheet(user);

      await user.click(screen.getByRole("button", { name: "Schließen" }));

      await waitFor(() => expect(sheet()).not.toBeInTheDocument());
      expect(band()).toHaveTextContent("Stand 18.10.");
      expect(figure("Gemessen")).toBe("98,4 kg");
    });
  });

  describe("while a fetch runs", () => {
    /**
     * Opens the page on 20.10. with the test data, starts a fetch with ⟳,
     * chooses `day` while it runs and lets Google answer with `measurements`.
     */
    async function fetchWhileChosen(
      day: string,
      measurements: GoogleHealthResult<Measurement[]>,
    ) {
      const fetching = holdFetch();
      const user = openHistoryOn("2026-10-20");
      await user.click(await signInButton());
      await tapOn(user, day);
      expect(band()).not.toBeNull();
      await act(async () => fetching.resolve(measurements));
      return user;
    }

    const fetched = (measurements: Measurement[]) => ({
      ok: true as const,
      value: measurements,
    });

    it("keeps the day chosen where it brings new measurements, and shows it anew", async () => {
      await fetchWhileChosen(
        "2026-10-18",
        fetched(
          weightHistoryUntil("2026-10-20", [
            at("2026-10-18T19:30:00+02:00", 99.1),
          ]),
        ),
      );

      await isShown("Letzte Messung 18.10. um 19:30 Uhr: 99,1 kg");
      expect(band()).toHaveTextContent("Stand 18.10.");
      expect(figure("Gemessen")).toBe("98,4 kg");
    });

    it("shows today where it leaves the day without a counting measurement", async () => {
      await fetchWhileChosen(
        "2026-10-18",
        fetched(
          weightHistoryUntil("2026-10-20").filter(
            (m) => berlinDay(m.time) !== "2026-10-18",
          ),
        ),
      );

      await waitFor(() => expect(band()).toBeNull());
      expect(await statusLine()).toBeInTheDocument();
      expect(screen.getByText(/^Letzte Messung /)).toHaveTextContent(
        /^Letzte Messung 20\.10\./,
      );
    });

    it("shows today where it leaves the day the last with a measurement", async () => {
      await fetchWhileChosen(
        "2026-10-18",
        fetched(weightHistoryUntil("2026-10-18")),
      );

      await waitFor(() => expect(band()).toBeNull());
      expect(await statusLine()).toBeInTheDocument();
    });

    it("keeps showing today where a later fetch brings the day back as an earlier one", async () => {
      const user = await fetchWhileChosen(
        "2026-10-18",
        fetched(weightHistoryUntil("2026-10-18")),
      );
      await waitFor(() => expect(band()).toBeNull());
      google.measurements = weightHistoryUntil("2026-10-20");

      await user.click(await refreshButton());

      expect(
        await screen.findByText(/^Letzte Messung 20\.10\./),
      ).toBeInTheDocument();
      expect(band()).toBeNull();
    });

    it("shows today where it fails, and the failure in the status line", async () => {
      await fetchWhileChosen("2026-10-18", failure({ kind: "unreachable" }));

      await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
      expect(band()).toBeNull();
      expect(await statusLine()).toContainElement(
        screen.getByText("Abruf fehlgeschlagen: Google antwortet nicht."),
      );
    });

    it("lets a day be chosen again after it failed", async () => {
      const user = await fetchWhileChosen(
        "2026-10-18",
        failure({ kind: "unreachable" }),
      );
      await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");

      await tapOn(user, "2026-10-14");

      expect(band()).toHaveTextContent("Stand 14.10.");
    });
  });

  describe("with the keyboard", () => {
    /** Tabs from the start of the page until the graph has the focus. */
    async function tabToGraph(user: UserEvent) {
      const target = await graph();
      for (let i = 0; i < 10 && document.activeElement !== target; i++)
        await user.tab();
      expect(target).toHaveFocus();
    }

    it("reaches the graph with Tab, with no day chosen yet", async () => {
      const user = openHistoryOn("2026-10-20");

      await tabToGraph(user);

      expect(band()).toBeNull();
    });

    it("chooses the day with a measurement before with ←, and after with →", async () => {
      const user = openHistoryOn("2026-10-20");
      await tabToGraph(user);

      await user.keyboard("{ArrowLeft}");
      expect(band()).toHaveTextContent("Stand 19.10.");
      await user.keyboard("{ArrowLeft}");
      expect(band()).toHaveTextContent("Stand 18.10.");
      await user.keyboard("{ArrowRight}");
      expect(band()).toHaveTextContent("Stand 19.10.");
    });

    it("comes back to today with → onto the last day with a measurement", async () => {
      const user = openHistoryOn("2026-10-20");
      await tabToGraph(user);
      await user.keyboard("{ArrowLeft}");

      await user.keyboard("{ArrowRight}");

      expect(band()).toBeNull();
      await user.keyboard("{ArrowRight}");
      expect(band()).toBeNull();
    });

    it("steps over a gap with ←", async () => {
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-10-01");

      await user.keyboard("{ArrowLeft}");

      expect(band()).toHaveTextContent("Stand 22.9.");
    });

    it("stays on the first day of the six weeks with ←", async () => {
      const user = openHistoryOn("2026-10-20");
      await tapOn(user, "2026-09-09");

      await user.keyboard("{ArrowLeft}");

      expect(band()).toHaveTextContent("Stand 9.9.");
    });
  });
});
