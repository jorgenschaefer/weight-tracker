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
import {
  type AccessToken,
  fetchMeasurements,
  type GoogleHealthError,
  type GoogleHealthResult,
  loadGoogleSignIn,
  revokeAccess,
  signIn,
} from "@/measurement/google-health";

/** What went wrong on the page, and in doing what. */
export interface Problem {
  action: "fetch" | "revoke";
  error: GoogleHealthError;
}

/** The measurements on the page and what the person can do with them. */
export interface Measurements {
  /** The cached measurements; `null` before the first fetch. */
  cache: MeasurementCache | null;
  fetching: boolean;
  /** Whether this visit holds an access token; without one a fetch signs in. */
  signedIn: boolean;
  problem: Problem | null;
  /** Signs in where needed and fetches. Call it straight from the click. */
  fetchData(): void;
  /** Clears the cache, discards the token and revokes the page's access. */
  logOut(): void;
}

/**
 * The measurements of the page, read from the cache in this browser once the
 * page is mounted - `null` until then - and fetched from Google Health. The
 * access token lives here, in memory only.
 */
export function useMeasurements(): Measurements | null {
  const [cache, setCache] = useState<MeasurementCache | null | undefined>();
  const [token, setToken] = useState<AccessToken | null>(null);
  const [fetching, setFetching] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  // Counts the log-outs, so a fetch that outlives one is dropped rather than
  // filling the cache it just cleared.
  const logOuts = useRef(0);

  useEffect(() => {
    loadGoogleSignIn();
    setCache(loadCache());
  }, []);

  if (cache === undefined) return null;

  async function fetchData(cached: MeasurementCache | null) {
    const started = logOuts.current;
    const isCurrent = () => logOuts.current === started;
    setFetching(true);
    setProblem(null);

    // signIn runs before the first await, so the popup still counts as
    // opened by the click.
    const access = token === null ? await signIn() : signedInWith(token);
    if (!isCurrent()) return;
    if (!access.ok) {
      setFetching(false);
      setProblem({ action: "fetch", error: access.error });
      return;
    }
    setToken(access.value);

    const period = periodToFetch(cached, new Date());
    const fetched = await fetchMeasurements(access.value, period.from);
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
  }

  async function revoke(held: AccessToken | null) {
    const started = logOuts.current;
    const access = held === null ? await signIn() : signedInWith(held);
    const revoked = access.ok ? await revokeAccess(access.value) : access;
    if (!revoked.ok && logOuts.current === started) {
      setProblem({ action: "revoke", error: revoked.error });
    }
  }

  return {
    cache,
    fetching,
    signedIn: token !== null,
    problem,
    fetchData: () => void fetchData(cache),
    logOut: () => {
      logOuts.current += 1;
      removeCache();
      setCache(null);
      setToken(null);
      setFetching(false);
      setProblem(null);
      void revoke(token);
    },
  };
}

/** The sign-in this visit already holds, as a sign-in would yield it. */
function signedInWith(token: AccessToken): GoogleHealthResult<AccessToken> {
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
