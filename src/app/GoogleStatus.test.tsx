import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
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
  google,
  holdFetch,
  isNotShown,
  isShown,
  leavePage,
  MORNING,
  MORNING_SHOWN,
  NOT_YET_FETCHED,
  NOW,
  openAndClick,
  refreshButton,
  renderPage,
  signInButton,
  standInForGoogle,
  statusDetail,
  statusLine,
  statusMark,
  storeLoss,
  storeMorning,
  TOKEN_LIFETIME_S,
} from "@/test/open-page";
import { GoogleStatus } from "./GoogleStatus";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

beforeEach(() => standInForGoogle(NOW));
afterEach(leavePage);

const HINT = "Tippe oben auf die Zeile, um dich bei Google anzumelden.";

/** Holds the next sign-in until the test answers it. */
function holdSignIn() {
  const answer = deferred<GoogleHealthResult<SignedIn>>();
  vi.mocked(signIn).mockReturnValueOnce(answer.promise);
  return answer;
}

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
    expect(fetchMeasurements).toHaveBeenCalledTimes(2);
    expect(google.tokensIssued).toBe(1);
  });

  it("on ⟳ signs in anew where the sign-in the page holds has expired while it stayed in view", async () => {
    const user = await signInAndFetch();
    vi.setSystemTime(new Date(NOW.getTime() + TOKEN_LIFETIME_S * 1000));

    await user.click(await refreshButton());

    await detailIs("abgerufen 10:59 Uhr");
    expect(google.tokensIssued).toBe(2);
  });

  it("on the status line of a page that is signed in does nothing", async () => {
    const user = await signInAndFetch();

    await user.click(await statusLine());

    expect(fetchMeasurements).toHaveBeenCalledTimes(1);
    expect(await statusDetail()).toBe("abgerufen 10:00 Uhr");
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

    const announced = await screen.findByRole("status");
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

describe("the rest of the page while a fetch runs", () => {
  it("stays as it is, nothing provisional or dimmed", async () => {
    storeLoss();
    holdFetch();
    await openAndClick(signInButton);

    await detailIs("ruft ab …");
    isNotShown(/aktualisiert/);
    const verdict = screen.getByRole("heading", { level: 1 });
    expect(verdict).toHaveTextContent("Du nimmst seit Wochen ab.");
    expect(verdict.closest("[aria-busy]")).toBeNull();
  });
});

describe("the first visit", () => {
  it.each<[string, (() => void) | null]>([
    ["not signed in", null],
    ["while signing in", () => holdSignIn()],
    ["while fetching", () => holdFetch()],
    [
      "after a failed fetch",
      () =>
        vi
          .mocked(fetchMeasurements)
          .mockResolvedValueOnce(failure({ kind: "unreachable" })),
    ],
  ])(
    "shows the sentence about the page and the hint to tap the line, %s",
    async (_, beforeTap) => {
      if (beforeTap === null) renderPage();
      else {
        beforeTap();
        await openAndClick(signInButton);
      }

      await isShown(FIRST_VISIT);
      const hint = await screen.findByText(HINT);
      expect(screen.getByText(FIRST_VISIT).compareDocumentPosition(hint)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
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

describe("the layout", () => {
  // jsdom lays nothing out, so the stylesheets are read instead.
  const css = (file: string) =>
    readFileSync(join(import.meta.dirname, file), "utf8");
  const status = css("GoogleStatus.module.css");
  const wide = (stylesheet: string) =>
    /@media \(min-width: 65em\)\s*\{([\s\S]*)\}\s*$/.exec(stylesheet)?.[1];

  it("makes ⟳ 48 × 48 px and the status line at least 48 px tall", () => {
    const refresh = /\.refresh\s*\{([^}]*)\}/.exec(status)?.[1];
    expect(refresh).toMatch(/width:\s*48px/);
    expect(refresh).toMatch(/height:\s*48px/);
    expect(/\.line\s*\{([^}]*)\}/.exec(status)?.[1]).toMatch(
      /min-height:\s*48px/,
    );
  });

  it("puts the status line and ⟳ on the wide screen at the right, as wide as the column of the four figures", () => {
    const figuresColumn =
      /grid-template-columns:\s*minmax\(0, 1fr\) (\d+px)/.exec(
        wide(css("page.module.css")) ?? "",
      )?.[1];
    const statusRule = /\.status\s*\{([^}]*)\}/.exec(wide(status) ?? "")?.[1];

    expect(figuresColumn).toBe("420px");
    expect(statusRule).toMatch(new RegExp(`width:\\s*${figuresColumn}`));
    expect(statusRule).toMatch(/margin-left:\s*auto/);
  });

  it("shows a failure neither faded nor light", () => {
    const failed = /\.line\[data-failed\] \.detail\s*\{([^}]*)\}/.exec(
      status,
    )?.[1];
    expect(failed).toMatch(/opacity:\s*1;/);
    expect(failed).toMatch(/font-weight:\s*600;/);
  });
});
