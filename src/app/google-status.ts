import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import type { GoogleHealthError } from "@/measurement/google-health";
import { failureReason } from "./failure-reason";
import { formatDay, formatKg, formatTime } from "./format";
import type { HeldToken } from "./held-token";

/** What the page knows of its sign-in at Google and of what is running. */
export interface GoogleState {
  signedIn: boolean;
  /** Whether a sign-in popup is open. */
  signingIn: boolean;
  /** The weight being entered while Google has not taken it; `null` if none. */
  savingKg: number | null;
  fetching: boolean;
  /** Why the last fetch or sign-in for one failed, until the next begins. */
  fetchFailure: GoogleHealthError | null;
  /** When the last fetch that succeeded started; `null` before the first. */
  fetchedAt: Date | null;
}

/** The mark before „Google Health“. */
export type StatusMark = "signedIn" | "signedOut" | "failed";

/**
 * The mark of the status line, its second line, and whether a sign-in, a
 * fetch or an entry runs, in which ⟳ turns and takes no tap.
 */
export interface StatusLine {
  mark: StatusMark;
  detail: string;
  busy: boolean;
}

/**
 * The status line of `state` on a page that judges on `today`: the second
 * line says the first that applies, from „meldet an …“ to when the last fetch
 * was. The exclamation mark goes with „Abruf fehlgeschlagen: …“ and only with
 * it; otherwise the mark says whether the page is signed in.
 */
export function statusLine(state: GoogleState, today: CalendarDay): StatusLine {
  const busy = state.signingIn || state.savingKg !== null || state.fetching;
  return { ...markAndDetail(state, today), busy };
}

/**
 * Until when the page is signed in, in the sheet of the status line, with
 * „, nur Lesen“ where the sign-in does not allow entering.
 */
export function signedInUntil(signIn: Omit<HeldToken, "token">): string {
  const readOnly = signIn.writeGranted ? "" : ", nur Lesen";
  return `Angemeldet bis ${clock(signIn.expiresAt)}${readOnly}`;
}

/** When the last fetch was, in the sheet of the status line. */
export function lastFetch(fetchedAt: Date | null, today: CalendarDay): string {
  const said = fetched(fetchedAt, today);
  return said.charAt(0).toUpperCase() + said.slice(1);
}

/** The mark and the second line of {@link statusLine}. */
function markAndDetail(
  state: GoogleState,
  today: CalendarDay,
): Omit<StatusLine, "busy"> {
  const mark = state.signedIn ? "signedIn" : "signedOut";
  if (state.signingIn) return { mark, detail: "meldet an …" };
  if (state.savingKg !== null) {
    return { mark, detail: `speichert ${formatKg(state.savingKg)} kg …` };
  }
  if (state.fetching) return { mark, detail: "ruft ab …" };
  if (state.fetchFailure !== null) {
    return {
      mark: "failed",
      detail: `Abruf fehlgeschlagen: ${failureReason(state.fetchFailure)}`,
    };
  }
  if (!state.signedIn) return { mark, detail: "nicht angemeldet" };
  return { mark, detail: fetched(state.fetchedAt, today) };
}

/** When the last fetch that succeeded started, `fetchedAt`, seen on `today`. */
function fetched(fetchedAt: Date | null, today: CalendarDay): string {
  if (fetchedAt === null) return "noch nicht abgerufen";
  if (berlinDay(fetchedAt) === today) return `abgerufen ${clock(fetchedAt)}`;
  return `abgerufen ${formatDay(fetchedAt)} um ${clock(fetchedAt)}`;
}

/**
 * `instant` on the clock in Berlin, as „7:14 Uhr“, with a space that does not
 * break: the time and „Uhr“ stay on one line.
 */
function clock(instant: Date): string {
  return `${formatTime(instant)}\u00a0Uhr`;
}
