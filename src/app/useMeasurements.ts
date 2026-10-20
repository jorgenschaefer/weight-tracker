"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  CACHE_KEY,
  type MeasurementCache,
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
  fetching: boolean;
  /** Whether this visit holds an access token; without one a fetch signs in. */
  signedIn: boolean;
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
  const [fetching, setFetching] = useState(false);
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

  // When the last fetch started, so coming back into view soon after it does
  // not fetch again.
  const lastFetchStarted = useRef<number | null>(null);

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

  // While this visit holds a token, the page fetches by itself when it comes
  // back into view: a tab left open gets a weighing of the last hour without
  // a click. Once the token has expired it drops it instead, and the status
  // line says the page is not signed in. Subscribed anew on each render, so
  // it sees the current state.
  useEffect(() => {
    if (token === null || cache === undefined) return;
    const fetchOnReturn = () => {
      if (document.visibilityState !== "visible" || fetching) return;
      if (hasExpired(token, new Date())) {
        dropToken(token);
        return;
      }
      const since = Date.now() - (lastFetchStarted.current ?? 0);
      if (since < REFETCH_AFTER_MS) return;
      void fetchData(cache, token);
    };
    document.addEventListener("visibilitychange", fetchOnReturn);
    return () =>
      document.removeEventListener("visibilitychange", fetchOnReturn);
  });

  const enteredMeasurements = entered.measurements;
  if (cache === undefined || enteredMeasurements === null) return null;

  async function fetchData(
    cached: MeasurementCache | null,
    heldToken: HeldToken | null,
  ) {
    lastFetchStarted.current = Date.now();
    const started = logOuts.current;
    const thisFetch = ++fetchesStarted.current;
    const isCurrent = () =>
      logOuts.current === started && fetchesStarted.current === thisFetch;
    setFetching(true);
    setFetchFailure(null);

    // signIn runs before the first await, so the popup still counts as
    // opened by the click.
    const access =
      heldToken === null ? await signInWithPopup() : signedInWith(heldToken);
    if (!isCurrent()) return;
    if (!access.ok) {
      setFetching(false);
      setFetchFailure(access.error);
      return;
    }
    if (heldToken === null) saveToken(access.value);
    setToken(access.value);

    const period = periodToFetch(cached, new Date());
    const fetched = await fetchMeasurements(access.value.token, period.from);
    if (!isCurrent()) return;
    setFetching(false);
    if (!fetched.ok) {
      if (fetched.error.kind === "tokenRejected") dropToken(access.value);
      setFetchFailure(fetched.error);
      return;
    }
    const replaced = replaceFetchedPeriod(cached, period, fetched.value);
    saveCache(replaced);
    setCache(replaced);
    entered.dropAfterFetch(fetched.value, period.to);
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
    if (!access.value.writeGranted) {
      return { ok: false, error: { kind: "writeNotGranted" } };
    }

    setSavingKg(kg);
    const saved = await enterMeasurement(access.value.token, measurement);
    setSavingKg(null);
    if (!saved.ok) {
      if (saved.error.kind === "tokenRejected") dropToken(access.value);
      return saved;
    }
    entered.add(measurement);
    // The fetch holds the sign-in from here on. One whose save failed is not
    // held: it has fetched nothing, and holding it would take „Daten abrufen“
    // away.
    if (!holdsOne) saveToken(access.value);
    void fetchData(cached, access.value);
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
    signedIn: token !== null,
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
      setFetching(false);
      setFetchFailure(null);
      setRevokeFailure(null);
      // An expired token cannot revoke; a new sign-in gets one that can.
      void revoke(unexpired(token, new Date()));
    },
  };
}

const REFETCH_AFTER_MS = 5 * 60_000;

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
