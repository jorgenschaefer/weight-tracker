"use client";

import { useEffect, useRef, useState } from "react";
import {
  CACHE_KEY,
  type MeasurementCache,
  parseCache,
  periodToFetch,
  replaceFetchedPeriod,
  serializeCache,
} from "@/measurement/cache";
import { notYetFetched } from "@/measurement/entered-measurement";
import {
  type AccessToken,
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthError,
  type GoogleHealthResult,
  loadGoogleSignIn,
  revokeAccess,
  type SignedIn,
  signIn,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";

/** What went wrong on the page, and in doing what. */
export interface Problem {
  action: "fetch" | "revoke";
  error: GoogleHealthError;
}

/** The measurements on the page and what the person can do with them. */
export interface Measurements {
  /** The cached measurements; `null` before the first fetch. */
  cache: MeasurementCache | null;
  /** The measurements entered in this visit that no fetch has held yet. */
  enteredMeasurements: Measurement[];
  fetching: boolean;
  /** Whether this visit holds an access token; without one a fetch signs in. */
  signedIn: boolean;
  problem: Problem | null;
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
 * The measurements of the page, read from the cache in this browser once the
 * page is mounted - `null` until then - and fetched from Google Health. The
 * access token lives here, in memory only.
 */
export function useMeasurements(): Measurements | null {
  const [cache, setCache] = useState<MeasurementCache | null | undefined>();
  const [enteredMeasurements, setEnteredMeasurements] = useState<Measurement[]>(
    [],
  );
  const [token, setToken] = useState<HeldToken | null>(null);
  const [fetching, setFetching] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
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

  useEffect(() => {
    loadGoogleSignIn();
    setCache(loadCache());
  }, []);

  // While this visit holds a token, the page fetches by itself when it comes
  // back into view: a tab left open gets a weighing of the last hour without
  // a click. Once the token has expired it drops it instead, and the button
  // shows. Subscribed anew on each render, so it sees the current state.
  useEffect(() => {
    if (token === null || cache === undefined) return;
    const fetchOnReturn = () => {
      if (document.visibilityState !== "visible" || fetching) return;
      if (hasExpired(token)) {
        setToken(null);
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

  if (cache === undefined) return null;

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
    setProblem(null);

    // signIn runs before the first await, so the popup still counts as
    // opened by the click.
    const access =
      heldToken === null ? held(await signIn()) : signedInWith(heldToken);
    if (!isCurrent()) return;
    if (!access.ok) {
      setFetching(false);
      setProblem({ action: "fetch", error: access.error });
      return;
    }
    setToken(access.value);

    const period = periodToFetch(cached, new Date());
    const fetched = await fetchMeasurements(access.value.token, period.from);
    if (!isCurrent()) return;
    setFetching(false);
    if (!fetched.ok) {
      if (fetched.error.kind === "tokenRejected") setToken(null);
      setProblem({ action: "fetch", error: fetched.error });
      return;
    }
    const replaced = replaceFetchedPeriod(cached, period, fetched.value);
    saveCache(replaced);
    setCache(replaced);
    setEnteredMeasurements((entered) => notYetFetched(entered, fetched.value));
  }

  async function enter(
    kg: number,
    cached: MeasurementCache | null,
  ): Promise<GoogleHealthResult<null>> {
    const entered: Measurement = { time: new Date(), kg };
    // signIn runs before the first await, so the popup still counts as
    // opened by the click.
    const access = maySave(token) ? signedInWith(token) : held(await signIn());
    if (!access.ok) return access;
    if (!access.value.writeGranted) {
      return { ok: false, error: { kind: "writeNotGranted" } };
    }

    const saved = await enterMeasurement(access.value.token, entered);
    if (!saved.ok) {
      if (saved.error.kind === "tokenRejected") setToken(null);
      return saved;
    }
    setEnteredMeasurements((earlier) => [...earlier, entered]);
    // The fetch holds the sign-in from here on. One whose save failed is not
    // held: it has fetched nothing, and holding it would take „Daten abrufen“
    // away.
    void fetchData(cached, access.value);
    return saved;
  }

  async function revoke(heldToken: HeldToken | null) {
    const started = logOuts.current;
    const access =
      heldToken === null ? held(await signIn()) : signedInWith(heldToken);
    const revoked = access.ok ? await revokeAccess(access.value.token) : access;
    if (!revoked.ok && logOuts.current === started) {
      setProblem({ action: "revoke", error: revoked.error });
    }
  }

  return {
    cache,
    enteredMeasurements,
    fetching,
    signedIn: token !== null,
    problem,
    fetchData: () => void fetchData(cache, token),
    enter: (kg) => enter(kg, cache),
    logOut: () => {
      logOuts.current += 1;
      removeCache();
      setCache(null);
      setEnteredMeasurements([]);
      setToken(null);
      setFetching(false);
      setProblem(null);
      // An expired token cannot revoke; a new sign-in gets one that can.
      void revoke(token !== null && !hasExpired(token) ? token : null);
    },
  };
}

const REFETCH_AFTER_MS = 5 * 60_000;

/**
 * The access token this visit holds, when Google stops accepting it, and
 * whether it may enter measurements.
 */
interface HeldToken {
  token: AccessToken;
  /** Milliseconds since the epoch, as `Date.now()` counts them. */
  expiresAt: number;
  writeGranted: boolean;
}

/** Whether `token` is held, not expired and may enter measurements. */
function maySave(token: HeldToken | null): token is HeldToken {
  return token?.writeGranted === true && !hasExpired(token);
}

function hasExpired(token: HeldToken): boolean {
  return Date.now() >= token.expiresAt;
}

/** The token of a sign-in, held from now on. */
function held(
  signedIn: GoogleHealthResult<SignedIn>,
): GoogleHealthResult<HeldToken> {
  if (!signedIn.ok) return signedIn;
  const { token, expiresInSeconds, writeGranted } = signedIn.value;
  return {
    ok: true,
    value: {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
      writeGranted,
    },
  };
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
