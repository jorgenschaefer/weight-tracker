import { MantineProvider } from "@mantine/core";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { expect, vi } from "vitest";
import Page from "@/app/page";
import { CACHE_KEY, parseCache, serializeCache } from "@/measurement/cache";
import {
  type CalendarDay,
  calendarDayBefore,
  MS_PER_DAY,
} from "@/measurement/calendar-day";
import {
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthError,
  type GoogleHealthResult,
  revokeAccess,
  type SignedIn,
  signIn,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";
import { stubContainerWidth } from "./container-width";
import { weightHistoryUntil } from "./weight-history-fixture";

/**
 * Opening the page in tests, against Google in memory. A test file using it
 * replaces `@/measurement/google-health` with `vi.fn()`s, calls
 * {@link standInForGoogle} before each test and {@link leavePage} after it.
 */

/**
 * Google, in memory: the measurements in Google Health, the access tokens it
 * has granted the page, to read and to write, and not yet revoked, and how
 * many it has issued.
 */
export const google = {
  measurements: [] as Measurement[],
  grants: [] as string[],
  tokensIssued: 0,
};

/**
 * Sets the clock to `now`, empties the cache and Google, and makes the
 * mocked Google module answer from {@link google}, dropping every answer a
 * test before held for it.
 */
export function standInForGoogle(now: Date) {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  localStorage.clear();
  google.measurements = [];
  google.grants = [];
  google.tokensIssued = 0;

  vi.mocked(signIn).mockImplementation(async () => {
    const token = `token-${++google.tokensIssued}`;
    google.grants.push(token);
    return {
      ok: true,
      value: { token, expiresInSeconds: TOKEN_LIFETIME_S, writeGranted: true },
    };
  });
  vi.mocked(fetchMeasurements).mockImplementation(async (token, from) => {
    if (!google.grants.includes(token))
      return failure({ kind: "tokenRejected" });
    return {
      ok: true,
      value: google.measurements.filter((m) => m.time >= from),
    };
  });
  vi.mocked(enterMeasurement).mockImplementation(async (token, entered) => {
    if (!google.grants.includes(token))
      return failure({ kind: "tokenRejected" });
    google.measurements.push(entered);
    return { ok: true, value: null };
  });
  vi.mocked(revokeAccess).mockImplementation(async (token) => {
    google.grants = google.grants.filter((t) => t !== token);
    return { ok: true, value: null };
  });
}

/** How long Google accepts an access token: an hour, less a second. */
export const TOKEN_LIFETIME_S = 3599;

/**
 * Lets the page's timeouts run on the faked clock, set to `now`, which moves
 * on with the real one too, so Testing Library's waiting still ends.
 */
export function runTimersFrom(now: Date) {
  vi.useFakeTimers({
    toFake: ["Date", "setTimeout", "clearTimeout"],
    shouldAdvanceTime: true,
  });
  vi.setSystemTime(now);
}

/** Moves the faked clock and the timeouts on it by `ms`. */
export const passTime = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

export function leavePage() {
  vi.useRealTimers();
  vi.unstubAllGlobals();
}

export function failure(error: GoogleHealthError): {
  ok: false;
  error: GoogleHealthError;
} {
  return { ok: false, error };
}

export const at = (time: string | Date, kg: number): Measurement => ({
  time: new Date(time),
  kg,
});

/** One measurement at 7:00 in Berlin summer time on `day`. */
const morningOf = (day: string, kg: number): Measurement => ({
  time: new Date(`${day}T07:00:00+02:00`),
  kg,
});

/**
 * One measurement a day for `days` days up to `lastDay`, on a straight line
 * changing by `kgPerWeek` and ending at `lastKg`: its trend is the line.
 */
export function steady(
  lastDay: string,
  days: number,
  kgPerWeek: number,
  lastKg = 95,
): Measurement[] {
  return Array.from({ length: days }, (_, i) => {
    const daysBefore = days - 1 - i;
    // Safe: `lastDay` is a valid `YYYY-MM-DD`.
    const day = calendarDayBefore(lastDay as CalendarDay, daysBefore);
    return morningOf(day, lastKg - (kgPerWeek / 7) * daysBefore);
  });
}

export function storeCache(fetchedAt: Date, measurements: Measurement[]) {
  localStorage.setItem(CACHE_KEY, serializeCache({ fetchedAt, measurements }));
}

export const storedCache = () => parseCache(localStorage.getItem(CACHE_KEY));

/** Opens the page on a screen `width` px wide; returns the user to click on with. */
export function renderPage(width = 320) {
  stubContainerWidth(width);
  render(
    <MantineProvider>
      <Page />
    </MantineProvider>,
  );
  return userEvent.setup();
}

/**
 * Closes the page and opens it again, as a reload, a new tab or the app
 * opened anew does; returns the user to click on with.
 */
export function reload() {
  cleanup();
  return renderPage();
}

/** The page comes back into view, as on switching tabs or apps. */
export async function comeIntoView() {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** 18:00 in Berlin summer time on `day`. */
export const evening = (day: string) => new Date(`${day}T18:00:00+02:00`);

/** Opens the page in the evening of `today`, with `measurements` in the cache. */
export function openOn(today: string, measurements: Measurement[]) {
  vi.setSystemTime(evening(today));
  storeCache(evening(today), measurements);
  renderPage();
}

/**
 * Opens the page in the evening of `today` with the user's weight and 18.10.
 * to 20.10., up to `lastDay`.
 */
export const openHistoryOn = (today: string, lastDay = today) =>
  openOn(today, weightHistoryUntil(lastDay));

/** Opens the page and clicks `button`; returns the user to click on with. */
export async function openAndClick(button: () => Promise<HTMLElement>) {
  const user = renderPage();
  await user.click(await button());
  return user;
}

/** Opens the sheet on the page, types `input` and taps „Eintragen“. */
export async function enterWeight(user: UserEvent, input = "98,6") {
  await user.type(await openEntrySheet(user), input);
  await user.click(screen.getByRole("button", { name: "Eintragen" }));
}

/** Opens the sheet to enter a weight; returns its field „Gewicht heute“. */
export async function openEntrySheet(user: UserEvent) {
  await user.click(
    await screen.findByRole("button", { name: "Gewicht eintragen" }),
  );
  return screen.findByRole("textbox", { name: "Gewicht heute" });
}

/** 98,6 kg entered at {@link NOW}, as „Letzte Messung“ shows it once fetched. */
export const ENTERED_SHOWN = "Letzte Messung 17.10. um 10:00 Uhr: 98,6 kg";
export const NOT_YET_FETCHED = ", noch nicht aus Google Health abgerufen";

export const sheet = () =>
  screen.queryByRole("dialog", { name: "Gewicht eintragen" });

/** The status line, named „Google Health, <its second line>“. */
export const statusLine = () =>
  screen.findByRole("button", { name: /^Google Health/ });

/** ⟳, whether the page is signed in or not. */
export const refreshButton = () =>
  screen.findByRole("button", { name: /^(Abrufen|Anmelden und abrufen)$/ });

/** ⟳ on a page that is not signed in. */
export const signInButton = () =>
  screen.findByRole("button", { name: "Anmelden und abrufen" });

/** The second line of the status line, spaces that do not break as spaces. */
export const statusDetail = async () =>
  (await statusLine())
    .querySelector("[data-detail]")
    ?.textContent?.replaceAll(" ", " ");

/** The mark before „Google Health“: `signedIn`, `signedOut` or `failed`. */
export const statusMark = async () =>
  (await statusLine()).querySelector("[data-mark]")?.getAttribute("data-mark");

/** The sheet a tap on the status line of a signed-in page opens. */
export const statusSheet = () =>
  screen.queryByRole("dialog", { name: "Google Health" });

/** Opens the sheet of the status line and taps „Abmelden“ in it. */
export async function logOut(user: UserEvent) {
  await user.click(await statusLine());
  await user.click(await screen.findByRole("button", { name: "Abmelden" }));
}

export const isShown = async (text: string) =>
  expect(await screen.findByText(text)).toBeInTheDocument();

export const isNotShown = (text: string | RegExp) =>
  expect(screen.queryByText(text)).not.toBeInTheDocument();

export const hasNoButton = (name: string) =>
  expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();

export const FIRST_VISIT =
  "Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue ein und zeigt dir, ob du noch abnimmst.";

/** The hint below {@link FIRST_VISIT}. */
export const HINT = "Tippe oben auf die Zeile, um dich bei Google anzumelden.";

/** A promise to hold a call with, settled by the test. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Holds the next sign-in until the test answers it. */
export function holdSignIn() {
  const answer = deferred<GoogleHealthResult<SignedIn>>();
  vi.mocked(signIn).mockReturnValueOnce(answer.promise);
  return answer;
}

/** Holds the next fetch until the test answers it. */
export function holdFetch() {
  const answer = deferred<GoogleHealthResult<Measurement[]>>();
  vi.mocked(fetchMeasurements).mockReturnValueOnce(answer.promise);
  return answer;
}

/** The time the tests of fetching run at. */
export const NOW = new Date("2026-10-17T08:00:00.000Z");
export const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * MS_PER_DAY);

/** One measurement, and how „Letzte Messung“ shows it. */
export const MORNING = at("2026-10-17T07:57:00Z", 98.599);
export const MORNING_SHOWN = "Letzte Messung 17.10. um 9:57 Uhr: 98,6 kg";

/** A cache from yesterday's fetch, holding {@link MORNING}. */
export const storeMorning = () => storeCache(daysAgo(1), [MORNING]);

/** A cache from yesterday's fetch, losing 0.5 kg a week for 5 weeks up to today: green, „Du nimmst seit Wochen ab.“ */
export const storeLoss = () =>
  storeCache(daysAgo(1), steady("2026-10-17", 35, -0.5));
