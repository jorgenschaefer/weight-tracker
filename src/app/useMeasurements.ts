"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  CACHE_KEY,
  type FetchPeriod,
  type MeasurementCache,
  olderPeriodToFetch,
  parseCache,
  periodToFetch,
  replaceFetchedPeriod,
  serializeCache,
} from "@/measurement/cache";
import {
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthError,
  type GoogleHealthResult,
  loadGoogleSignIn,
  revokeAccess,
  signIn,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";
import {
  type HeldToken,
  hasExpired,
  held,
  maySave,
  parseHeldToken,
  serializeHeldToken,
  TOKEN_KEY,
} from "./held-token";
import { useEnteredMeasurements } from "./useEnteredMeasurements";

/** The measurements on the page and what the person can do with them. */
export interface Measurements {
  /** The cached measurements; `null` before the first fetch. */
  cache: MeasurementCache | null;
  /** The measurements entered that Google Health has not returned yet. */
  enteredMeasurements: Measurement[];
  /** Whether a sign-in popup is open. */
  signingIn: boolean;
  /** The weight being entered while Google has not taken it; `null` if none. */
  savingKg: number | null;
  /**
   * Which part of a fetch runs: the first, or the older measurements behind
   * it (`olderPeriodToFetch`); `null` where none runs.
   */
  fetching: "first" | "older" | null;
  /**
   * Until when the sign-in this visit holds lasts and whether it may enter
   * measurements; `null` where it holds none, and a fetch signs in.
   */
  signIn: Omit<HeldToken, "token"> | null;
  /**
   * Why the last fetch or its sign-in failed, until the next fetch or
   * sign-in begins.
   */
  fetchFailure: GoogleHealthError | null;
  /** Why revoking the page's access on „Abmelden“ failed. */
  revokeFailure: GoogleHealthError | null;
  /** Signs in where needed and fetches. Call it straight from the click. */
  fetchData(): void;
  /**
   * Enters `kg` at this moment: signs in where the visit holds no sign-in
   * that may write, writes it into Google Health, shows it and fetches. Call
   * it straight from the click.
   */
  enter(kg: number): Promise<GoogleHealthResult<null>>;
  /**
   * Clears the cache and the entered measurements, discards the token and
   * revokes the page's access.
   */
  logOut(): void;
}

/**
 * The measurements of the page, read from the cache and the entered
 * measurements in this browser once the page is mounted - `null` until then -
 * and fetched from Google Health. The access token lives here, and in this
 * browser until it expires, so the page opened again within its lifetime
 * holds it and fetches at once.
 */
export function useMeasurements(): Measurements | null {
  const [cache, setCache] = useState<MeasurementCache | null | undefined>();
  const entered = useEnteredMeasurements();
  const [token, setToken] = useState<HeldToken | null>(null);
  const [signInsOpen, setSignInsOpen] = useState(0);
  const [savingKg, setSavingKg] = useState<number | null>(null);
  const [fetching, setFetching] = useState<Measurements["fetching"]>(null);
  const [fetchFailure, setFetchFailure] = useState<GoogleHealthError | null>(
    null,
  );
  const [revokeFailure, setRevokeFailure] = useState<GoogleHealthError | null>(
    null,
  );
  // Counts the log-outs, so a fetch that outlives one is dropped rather than
  // filling the cache it just cleared.
  const logOuts = useRef(0);
  // Counts the fetches started, so a fetch that a later one has overtaken -
  // „Eintragen“ fetches even while one runs - is dropped rather than
  // overwriting the later one's result.
  const fetchesStarted = useRef(0);

  const loadOnOpen = useEffectEvent(() => {
    loadGoogleSignIn();
    const cached = loadCache();
    setCache(cached);
    // A token a sign-in left in this browser counts as this visit's own until
    // it expires, so the page fetches with it at once.
    const stored = loadToken();
    if (stored === null) return;
    if (hasExpired(stored, new Date())) removeToken();
    else void fetchData(cached, stored);
  });
  useEffect(() => loadOnOpen(), []);

  // The page drops the token it holds as the token expires, without a tap,
  // and the status line says the page is not signed in. A timeout may not
  // have run while the device slept, so coming back into view drops an
  // expired one too.
  const dropOnExpiry = useEffectEvent((expiring: HeldToken) =>
    dropToken(expiring),
  );
  useEffect(() => {
    if (token === null) return;
    const expire = setTimeout(
      () => dropOnExpiry(token),
      token.expiresAt.getTime() - Date.now(),
    );
    const dropIfExpired = () => {
      if (hasExpired(token, new Date())) dropOnExpiry(token);
    };
    document.addEventListener("visibilitychange", dropIfExpired);
    return () => {
      clearTimeout(expire);
      document.removeEventListener("visibilitychange", dropIfExpired);
    };
  }, [token]);

  const enteredMeasurements = entered.measurements;
  if (cache === undefined || enteredMeasurements === null) return null;

  async function fetchData(
    cached: MeasurementCache | null,
    heldToken: HeldToken | null,
  ) {
    const started = logOuts.current;
    const thisFetch = ++fetchesStarted.current;
    const isCurrent = () =>
      logOuts.current === started && fetchesStarted.current === thisFetch;
    setFetching("first");
    setFetchFailure(null);

    // signIn runs before the first await, so the popup still counts as
    // opened by the click.
    const access =
      heldToken === null ? await signInWithPopup() : signedInWith(heldToken);
    if (!isCurrent()) return;
    if (!access.ok) {
      setFetching(null);
      setFetchFailure(access.error);
      return;
    }
    if (heldToken === null) saveToken(access.value);
    setToken(access.value);
    await fetchParts(cached, access.value, isCurrent);
  }

  /**
   * Fetches into `cached` with `heldToken`: the first part, and the older
   * measurements behind it where the cache does not hold them yet.
   */
  async function fetchParts(
    cached: MeasurementCache | null,
    heldToken: HeldToken,
    isCurrent: () => boolean,
  ) {
    // Both parts end where the fetch started, as the cache dates it.
    const startedAt = new Date();
    const first = periodToFetch(cached, startedAt);
    const withFirst = await fetchInto(cached, first, heldToken, isCurrent);
    if (withFirst === null) return;
    // The page shows the cache with the first part while the older
    // measurements are fetched behind it.
    const older = olderPeriodToFetch(withFirst, startedAt);
    if (older !== null) {
      setFetching("older");
      const withOlder = await fetchInto(withFirst, older, heldToken, isCurrent);
      if (withOlder === null) return;
    }
    setFetching(null);
  }

  /**
   * Fetches `period` with `heldToken` into `cached`, and keeps and shows the
   * cache it makes; `null` where the fetch failed, which ends it, or where
   * it is no longer current and is dropped.
   */
  async function fetchInto(
    cached: MeasurementCache | null,
    period: FetchPeriod,
    heldToken: HeldToken,
    isCurrent: () => boolean,
  ): Promise<MeasurementCache | null> {
    const fetched = await fetchMeasurements(heldToken.token, period.from);
    if (!isCurrent()) return null;
    if (!fetched.ok) {
      setFetching(null);
      if (fetched.error.kind === "tokenRejected") dropToken(heldToken);
      setFetchFailure(fetched.error);
      return null;
    }
    const replaced = replaceFetchedPeriod(cached, period, fetched.value);
    saveCache(replaced);
    setCache(replaced);
    entered.dropAfterFetch(fetched.value, period.to);
    return replaced;
  }

  async function enter(
    kg: number,
    cached: MeasurementCache | null,
  ): Promise<GoogleHealthResult<null>> {
    const measurement: Measurement = { time: new Date(), kg };
    // signIn runs before the first await, so the popup still counts as
    // opened by the click.
    const holdsOne = maySave(token, new Date());
    // A sign-in beginning ends what a failed fetch says, as a fetch does.
    if (!holdsOne) setFetchFailure(null);
    const access = holdsOne ? signedInWith(token) : await signInWithPopup();
    if (!access.ok) return access;
    let saved: GoogleHealthResult<null> = {
      ok: false,
      error: { kind: "writeNotGranted" },
    };
    if (access.value.writeGranted) {
      setSavingKg(kg);
      saved = await enterMeasurement(access.value.token, measurement);
      setSavingKg(null);
    }
    if (!saved.ok && saved.error.kind === "tokenRejected") {
      dropToken(access.value);
      return saved;
    }
    if (saved.ok) entered.add(measurement);
    // A sign-in of its own is kept, and fetches, even where saving failed.
    if (!holdsOne) saveToken(access.value);
    if (saved.ok || !holdsOne) void fetchData(cached, access.value);
    return saved;
  }

  /**
   * Signs in with Google's popup, which counts as open until Google answers.
   * Call it before the first await of a click, so the popup still counts as
   * opened by it.
   */
  async function signInWithPopup(): Promise<GoogleHealthResult<HeldToken>> {
    setSignInsOpen((open) => open + 1);
    const signedIn = await signIn();
    setSignInsOpen((open) => open - 1);
    return held(signedIn, new Date());
  }

  /**
   * Drops `unusable`, which Google no longer accepts, from this visit and
   * from this browser - there only while it is still the one kept, since
   * another tab may have signed in for a newer one since.
   */
  function dropToken(unusable: HeldToken) {
    setToken(null);
    if (loadToken()?.token === unusable.token) removeToken();
  }

  async function revoke(heldToken: HeldToken | null) {
    const started = logOuts.current;
    const access =
      heldToken === null ? await signInWithPopup() : signedInWith(heldToken);
    const revoked = access.ok ? await revokeAccess(access.value.token) : access;
    if (!revoked.ok && logOuts.current === started) {
      setRevokeFailure(revoked.error);
    }
  }

  return {
    cache,
    enteredMeasurements,
    signingIn: signInsOpen > 0,
    savingKg,
    fetching,
    signIn:
      token === null
        ? null
        : { expiresAt: token.expiresAt, writeGranted: token.writeGranted },
    fetchFailure,
    revokeFailure,
    // An expired token cannot fetch; a new sign-in gets one that can.
    fetchData: () => void fetchData(cache, unexpired(token, new Date())),
    enter: (kg) => enter(kg, cache),
    logOut: () => {
      logOuts.current += 1;
      removeCache();
      setCache(null);
      entered.clear();
      removeToken();
      setToken(null);
      setFetching(null);
      setFetchFailure(null);
      setRevokeFailure(null);
      // An expired token cannot revoke; a new sign-in gets one that can.
      void revoke(unexpired(token, new Date()));
    },
  };
}

/** `token` where Google still accepts it at `now`, otherwise `null`. */
function unexpired(token: HeldToken | null, now: Date): HeldToken | null {
  return token !== null && !hasExpired(token, now) ? token : null;
}

/** The sign-in this visit already holds, as a sign-in would yield it. */
function signedInWith(token: HeldToken): GoogleHealthResult<HeldToken> {
  return { ok: true, value: token };
}

function loadCache(): MeasurementCache | null {
  return parseCache(localStorage.getItem(CACHE_KEY));
}

function saveCache(cache: MeasurementCache): void {
  localStorage.setItem(CACHE_KEY, serializeCache(cache));
}

function removeCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

function loadToken(): HeldToken | null {
  return parseHeldToken(localStorage.getItem(TOKEN_KEY));
}

// The token of a sign-in is kept in this browser, not only in memory, so a
// reload, a new tab or the app opened anew within its lifetime fetches
// without a new sign-in. It is `localStorage` because `sessionStorage` is
// neither shared with a new tab nor kept when the installed app is closed.
function saveToken(token: HeldToken): void {
  localStorage.setItem(TOKEN_KEY, serializeHeldToken(token));
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
