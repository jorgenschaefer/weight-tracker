import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthResult,
  type SignedIn,
  signIn,
} from "@/measurement/google-health";
import {
  comeIntoView,
  deferred,
  ENTERED_SHOWN,
  enterWeight,
  FIRST_VISIT,
  failure,
  fetchesAsked,
  google,
  HINT,
  holdFetch,
  holdOlderFetch,
  holdSignIn,
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
  refreshButton,
  renderPage,
  runTimersFrom,
  signInButton,
  standInForGoogle,
  statusDetail,
  statusLine,
  statusMark,
  statusSheet,
  storeMorning,
  TOKEN_LIFETIME_S,
} from "@/test/open-page";
import { GoogleStatus } from "./GoogleStatus";
import sheetClasses from "./Sheet.module.css";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

beforeEach(() => standInForGoogle(NOW));
afterEach(leavePage);

/** Holds the next entry until the test answers it. */
function holdEntry() {
  const answer = deferred<GoogleHealthResult<null>>();
  vi.mocked(enterMeasurement).mockReturnValueOnce(answer.promise);
  return answer;
}

const SIGNED_IN: GoogleHealthResult<SignedIn> = {
  ok: true,
  value: { token: "token-1", expiresInSeconds: 3599, writeGranted: true },
};

/** Signs in with ⟳ and fetches {@link MORNING}, at 10:00 in Berlin. */
async function signInAndFetch() {
  google.measurements = [MORNING];
  const user = await openAndClick(signInButton);
  await isShown(MORNING_SHOWN);
  return user;
}

const detailIs = (detail: string) =>
  waitFor(async () => expect(await statusDetail()).toBe(detail));

describe("the status line", () => {
  it("stands above the first visit, „nicht angemeldet“ with the empty circle, and ⟳ beside it", async () => {
    renderPage();

    const line = await statusLine();
    expect(await statusDetail()).toBe("nicht angemeldet");
    expect(await statusMark()).toBe("signedOut");
    expect(line.compareDocumentPosition(screen.getByText(FIRST_VISIT))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(await signInButton()).toBeInTheDocument();
  });

  it("says when the page fetched, with the filled dot, above „Letzte Messung“", async () => {
    await signInAndFetch();

    expect(await statusDetail()).toBe("abgerufen 10:00 Uhr");
    expect(await statusMark()).toBe("signedIn");
    expect(
      (await statusLine()).compareDocumentPosition(
        screen.getByText(MORNING_SHOWN),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("never breaks between the time and „Uhr“", async () => {
    await signInAndFetch();

    expect(
      (await statusLine()).querySelector("[data-detail]")?.textContent,
    ).toBe("abgerufen 10:00 Uhr");
  });

  it("says the day too once the page judges on a day after the fetch", async () => {
    vi.setSystemTime(new Date("2026-10-17T21:58:00Z"));
    await signInAndFetch();
    vi.setSystemTime(new Date("2026-10-17T22:01:00Z"));

    await comeIntoView();

    await detailIs("abgerufen 17.10. um 23:58 Uhr");
  });

  it("says „meldet an …“ while the sign-in popup is open, and ⟳ turns and takes no tap", async () => {
    holdSignIn();
    await openAndClick(signInButton);

    await detailIs("meldet an …");
    const refresh = await refreshButton();
    expect(refresh).toBeDisabled();
    expect(refresh).toHaveAttribute("data-busy");
  });

  it("says „ruft ab …“ while a fetch runs, and ⟳ turns and takes no tap until it ends", async () => {
    const answer = holdFetch();
    await openAndClick(signInButton);

    await detailIs("ruft ab …");
    expect(await refreshButton()).toBeDisabled();
    expect(await refreshButton()).toHaveAttribute("data-busy");
    answer.resolve({ ok: true, value: [] });
    await detailIs("abgerufen 10:00 Uhr");
    expect(await refreshButton()).toBeEnabled();
    expect(await refreshButton()).not.toHaveAttribute("data-busy");
  });

  it("says „ruft ältere Messungen ab …“ while the older measurements are fetched, and ⟳ turns and takes no tap until it ends (AC-3)", async () => {
    const answer = holdOlderFetch();
    const user = await openAndClick(signInButton);

    await detailIs("ruft ältere Messungen ab …");
    const refresh = await refreshButton();
    expect(refresh).toBeDisabled();
    expect(refresh).toHaveAttribute("data-busy");
    await user.click(refresh);
    expect(fetchesAsked()).toBe(1);
    answer.resolve({ ok: true, value: [] });
    await detailIs("abgerufen 10:00 Uhr");
    expect(await refreshButton()).toBeEnabled();
    expect(await refreshButton()).not.toHaveAttribute("data-busy");
  });

  it("says „meldet an …“, „speichert <Gewicht> kg …“ and „ruft ab …“ in turn while „Eintragen“ signs in, saves and fetches, „Letzte Messung“ as before", async () => {
    const signedIn = holdSignIn();
    const saved = holdEntry();
    holdFetch();
    const user = renderPage();

    await enterWeight(user);
    await detailIs("meldet an …");
    expect(await refreshButton()).toBeDisabled();
    signedIn.resolve(SIGNED_IN);
    google.grants = ["token-1"];
    await detailIs("speichert 98,6 kg …");
    expect(await refreshButton()).toBeDisabled();
    saved.resolve({ ok: true, value: null });

    await detailIs("ruft ab …");
    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);
  });

  it("says „speichert …“ while an entry waits on Google, even while a fetch runs", async () => {
    const user = await signInAndFetch();
    holdFetch();
    await user.click(await refreshButton());
    holdEntry();

    await enterWeight(user, "84,1");

    await detailIs("speichert 84,1 kg …");
  });
});

describe("a failed fetch in the status line", () => {
  it("says why, not faded, with the exclamation mark, and nowhere else", async () => {
    storeMorning();
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await openAndClick(signInButton);

    await detailIs("Abruf fehlgeschlagen: Google antwortet nicht.");
    expect(await statusMark()).toBe("failed");
    expect(await statusLine()).toHaveAttribute("data-failed");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says why a sign-in through ⟳ failed, and offers it again", async () => {
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));
    await openAndClick(signInButton);

    await detailIs(
      "Abruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    expect(await statusMark()).toBe("failed");
    expect(await signInButton()).toBeEnabled();
  });

  it("stays where the page is no longer signed in for it", async () => {
    const user = await signInAndFetch();
    google.grants = [];

    await user.click(await refreshButton());

    await detailIs("Abruf fehlgeschlagen: Die Anmeldung ist abgelaufen.");
    expect(await statusMark()).toBe("failed");
    expect(await signInButton()).toBeInTheDocument();
  });

  it("gives way once the next fetch begins", async () => {
    const user = await signInAndFetch();
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await user.click(await refreshButton());
    await detailIs("Abruf fehlgeschlagen: Google antwortet nicht.");
    const answer = holdFetch();

    await user.click(await refreshButton());

    await detailIs("ruft ab …");
    answer.resolve({ ok: true, value: [MORNING] });
    await detailIs("abgerufen 10:00 Uhr");
    expect(await statusMark()).toBe("signedIn");
  });

  it("gives way once the next sign-in begins, also one of „Eintragen“", async () => {
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));
    const user = await openAndClick(signInButton);
    await detailIs(
      "Abruf fehlgeschlagen: Die Anmeldung bei Google wurde abgebrochen.",
    );
    vi.mocked(signIn).mockResolvedValueOnce(failure({ kind: "signInFailed" }));

    await enterWeight(user);

    await screen.findByText(/^Speichern fehlgeschlagen/);
    await detailIs("nicht angemeldet");
    expect(await statusMark()).toBe("signedOut");
  });
});

describe("a failed entry in the status line", () => {
  it("changes nothing", async () => {
    const user = await signInAndFetch();
    vi.mocked(enterMeasurement).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );

    await enterWeight(user);

    await isShown("Speichern fehlgeschlagen: Google antwortet nicht.");
    await detailIs("abgerufen 10:00 Uhr");
    expect(await statusMark()).toBe("signedIn");
  });

  it("only signs the page out where Google rejects the sign-in", async () => {
    const user = await signInAndFetch();
    google.grants = [];

    await enterWeight(user);

    await isShown("Speichern fehlgeschlagen: Die Anmeldung ist abgelaufen.");
    await detailIs("nicht angemeldet");
    expect(await statusMark()).toBe("signedOut");
  });
});

describe("a tap", () => {
  it("on the status line of a page that is not signed in signs in and fetches", async () => {
    google.measurements = [MORNING];

    await openAndClick(statusLine);

    await isShown(MORNING_SHOWN);
    expect(google.tokensIssued).toBe(1);
  });

  it("on ⟳ of a page that is signed in fetches, without signing in again", async () => {
    const user = await signInAndFetch();
    holdFetch();

    await user.click(await refreshButton());

    await detailIs("ruft ab …");
    expect(fetchesAsked()).toBe(2);
    expect(google.tokensIssued).toBe(1);
  });

  it("on ⟳ signs in anew where the sign-in the page holds has expired while it stayed in view", async () => {
    const user = await signInAndFetch();
    vi.setSystemTime(new Date(NOW.getTime() + TOKEN_LIFETIME_S * 1000));

    await user.click(await refreshButton());

    await detailIs("abgerufen 10:59 Uhr");
    expect(google.tokensIssued).toBe(2);
  });

  it("on the status line of a page that is signed in opens its sheet, without fetching", async () => {
    const user = await signInAndFetch();

    await user.click(await statusLine());

    await waitFor(() => expect(statusSheet()).toBeInTheDocument());
    expect(fetchesAsked()).toBe(1);
    expect(google.tokensIssued).toBe(1);
  });

  it("on the status line of a page that is not signed in does nothing while something runs", async () => {
    holdSignIn();
    const user = renderPage();
    await enterWeight(user);
    await detailIs("meldet an …");

    await user.click(await statusLine());

    expect(signIn).toHaveBeenCalledTimes(1);
  });
});

describe("the sheet of the status line", () => {
  /** The text of the sheet, spaces that do not break as spaces. */
  const sheetText = () => statusSheet()?.textContent?.replaceAll("\u00a0", " ");

  it("says until when the page is signed in and when it fetched, and offers „Abmelden“", async () => {
    const user = await signInAndFetch();

    await user.click(await statusLine());

    const sheet = await screen.findByRole("dialog", { name: "Google Health" });
    expect(sheet).toHaveTextContent("Angemeldet bis 10:59 Uhr");
    expect(sheet).toHaveTextContent("Abgerufen 10:00 Uhr");
    isNotShown(/nur Lesen/);
    expect(
      await screen.findByRole("button", { name: "Abmelden" }),
    ).toBeInTheDocument();
  });

  it("is the light sheet of „Gewicht eintragen“, its content as wide as the page's at most", async () => {
    const user = await signInAndFetch();

    await user.click(await statusLine());

    const sheet = await screen.findByRole("dialog", { name: "Google Health" });
    expect(sheet).toHaveClass(sheetClasses.sheet);
    expect(
      screen.getByRole("heading", { name: "Google Health" }).parentElement,
    ).toHaveClass(sheetClasses.part);
    expect(
      screen.getByRole("button", { name: "Abmelden" }).parentElement,
    ).toHaveClass(sheetClasses.part);
  });

  it("says „, nur Lesen“ where the sign-in does not allow entering", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      value: { token: "read", expiresInSeconds: 3599, writeGranted: false },
    });
    google.grants = ["read"];
    const user = await signInAndFetch();

    await user.click(await statusLine());

    await waitFor(() =>
      expect(sheetText()).toContain("Angemeldet bis 10:59 Uhr, nur Lesen"),
    );
  });

  it("says the day of the fetch where it was before the day the page judges on", async () => {
    storeMorning();
    const answer = holdFetch();
    const user = await openAndClick(signInButton);
    answer.resolve(failure({ kind: "unreachable" }));
    await detailIs("Abruf fehlgeschlagen: Google antwortet nicht.");

    await user.click(await statusLine());

    await waitFor(() =>
      expect(sheetText()).toContain("Abgerufen 16.10. um 10:00 Uhr"),
    );
  });

  it("says „Noch nicht abgerufen“ before the first fetch, and opens while one runs", async () => {
    holdFetch();
    const user = await openAndClick(signInButton);
    await detailIs("ruft ab …");

    await user.click(await statusLine());

    await waitFor(() => expect(sheetText()).toContain("Noch nicht abgerufen"));
  });

  it("opens after a failed fetch too", async () => {
    const user = await signInAndFetch();
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    await user.click(await refreshButton());
    await detailIs("Abruf fehlgeschlagen: Google antwortet nicht.");

    await user.click(await statusLine());

    await waitFor(() => expect(statusSheet()).toBeInTheDocument());
    expect(fetchesAsked()).toBe(2);
  });

  it.each<[string, (user: UserEvent) => Promise<void>]>([
    [
      "the X",
      (user) => user.click(screen.getByRole("button", { name: "Schließen" })),
    ],
    ["Escape", (user) => user.keyboard("{Escape}")],
  ])("closes on %s", async (_, close) => {
    const user = await signInAndFetch();
    await user.click(await statusLine());
    await screen.findByRole("dialog", { name: "Google Health" });

    await close(user);

    await waitFor(() => expect(statusSheet()).not.toBeInTheDocument());
  });

  it("closes on a tap beside it", async () => {
    const user = await signInAndFetch();
    await user.click(await statusLine());
    await screen.findByRole("dialog", { name: "Google Health" });

    // Mantine's overlay beside the sheet takes the tap.
    const overlay = document.querySelector(".mantine-Drawer-overlay");
    expect(overlay).not.toBeNull();
    // Safe: checked just above.
    await user.click(overlay as Element);

    await waitFor(() => expect(statusSheet()).not.toBeInTheDocument());
  });

  it("closes by itself as the sign-in expires", async () => {
    runTimersFrom(NOW);
    const user = await signInAndFetch();
    await user.click(await statusLine());
    await screen.findByRole("dialog", { name: "Google Health" });

    await passTime(TOKEN_LIFETIME_S * 1000);

    await waitFor(() => expect(statusSheet()).not.toBeInTheDocument());
    expect(await statusMark()).toBe("signedOut");
  });

  it("„Abmelden“ asks nothing, shows the first visit and says „nicht angemeldet“", async () => {
    const user = await signInAndFetch();

    await logOut(user);

    await isShown(FIRST_VISIT);
    await isShown(HINT);
    await detailIs("nicht angemeldet");
    expect(await statusMark()).toBe("signedOut");
    await waitFor(() => expect(statusSheet()).not.toBeInTheDocument());
    expect(google.grants).toEqual([]);
  });

  it("does not open again by itself on the next sign-in after „Abmelden“", async () => {
    const user = await signInAndFetch();
    await logOut(user);
    await detailIs("nicht angemeldet");

    await user.click(await signInButton());

    await isShown(MORNING_SHOWN);
    expect(statusSheet()).not.toBeInTheDocument();
  });
});

describe("for a screen reader", () => {
  it("names the status line by its whole text, and ⟳ „Anmelden und abrufen“ where the page is not signed in", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", {
        name: "Google Health, nicht angemeldet",
      }),
    ).toBeInTheDocument();
    expect(await signInButton()).toBeInTheDocument();
  });

  it("names ⟳ „Abrufen“ where the page is signed in", async () => {
    await signInAndFetch();

    expect((await statusLine()).getAttribute("aria-label")).toBe(
      "Google Health, abgerufen 10:00\u00a0Uhr",
    );
    expect(
      await screen.findByRole("button", { name: "Abrufen" }),
    ).toBeInTheDocument();
  });

  it("says each new state politely, without interrupting", async () => {
    const answer = holdFetch();
    await openAndClick(signInButton);

    // Safe: the status line sits in the element of GoogleStatus.
    const status = (await statusLine()).parentElement as HTMLElement;
    const announced = within(status).getByRole("status");
    expect(announced).toHaveAttribute("aria-live", "polite");
    await waitFor(() =>
      expect(announced).toHaveTextContent("Google Health, ruft ab …"),
    );
    answer.resolve({ ok: true, value: [] });
    await waitFor(() =>
      expect(announced).toHaveTextContent("Google Health, abgerufen 10:00 Uhr"),
    );
  });
});

describe("before the page has read this browser", () => {
  function renderUnread() {
    render(
      <MantineProvider>
        <GoogleStatus measurements={null} today={"2026-10-17" as CalendarDay} />
      </MantineProvider>,
    );
  }

  it("shows only „Google Health“, without a mark or a second line", () => {
    renderUnread();

    const line = screen.getByRole("button", { name: "Google Health" });
    expect(line.querySelector("[data-mark]")).toBeNull();
    expect(line.querySelector("[data-detail]")).toBeNull();
  });

  it("takes no tap, on the status line or ⟳", () => {
    renderUnread();

    expect(
      screen.getByRole("button", { name: "Google Health" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abrufen" })).toBeDisabled();
  });
});

describe("the layout", () => {
  // jsdom lays nothing out, so the stylesheets are read instead.
  const css = (file: string) =>
    readFileSync(join(import.meta.dirname, file), "utf8");
  const status = css("GoogleStatus.module.css");
  const wide = (stylesheet: string) =>
    /@media \(min-width: 65em\)\s*\{([\s\S]*)\}\s*$/.exec(stylesheet)?.[1];

  // The row stretches ⟳ to the line's height, also where a failure makes
  // the line taller.
  it("makes the status line at least 48 px tall and ⟳ 48 px wide and as tall as the line", () => {
    const refresh = /\.refresh\s*\{([^}]*)\}/.exec(status)?.[1];
    expect(refresh).toMatch(/width:\s*48px/);
    expect(refresh).not.toMatch(/(^|[^-])height/);
    expect(/\.status\s*\{([^}]*)\}/.exec(status)?.[1]).not.toMatch(
      /align-items/,
    );
    expect(/\.line\s*\{([^}]*)\}/.exec(status)?.[1]).toMatch(
      /min-height:\s*48px/,
    );
  });

  it("keeps the status line and ⟳ as wide as the content on the wide screen", () => {
    expect(/\.status\s*\{/.test(wide(status) ?? "")).toBe(false);
  });

  // „ruft ältere Messungen ab …“ is the longest second line while something
  // runs; where it does not fit, it takes another line rather than a cut.
  it("lets the second line wrap between words, and cuts nothing off (AC-11)", () => {
    for (const rule of [".line", ".text", ".detail"]) {
      const declarations = new RegExp(`\\${rule}\\s*\\{([^}]*)\\}`).exec(
        status,
      )?.[1];
      expect(declarations).toBeDefined();
      expect(declarations).not.toMatch(
        /white-space|overflow|text-overflow|word-break|line-clamp|(^|[^-])height:/,
      );
    }
  });

  it("keeps ⟳ still where the person asks for less motion", () => {
    const reduced =
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\}\s*\}/.exec(
        status,
      )?.[1];
    expect(reduced).toMatch(
      /\.refresh\[data-busy\] svg\s*\{\s*animation:\s*none;/,
    );
    // As specific as the turning rule, it wins only by coming after it.
    expect(status.indexOf("prefers-reduced-motion")).toBeGreaterThan(
      status.search(/\.refresh\[data-busy\] svg\s*\{\s*animation:\s*turn/),
    );
  });

  it("shows a failure neither faded nor light", () => {
    const failed = /\.line\[data-failed\] \.detail\s*\{([^}]*)\}/.exec(
      status,
    )?.[1];
    expect(failed).toMatch(/opacity:\s*1;/);
    expect(failed).toMatch(/font-weight:\s*600;/);
  });
});
