"use client";

import { Anchor, Button, Text, UnstyledButton } from "@mantine/core";
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
import { latestMeasurement } from "@/measurement/measurement";
import { formatDay, formatKg, formatTime } from "./format";
import classes from "./page.module.css";

export default function Page() {
  const measurements = useMeasurements();
  return (
    <main className={classes.surface}>
      {measurements !== null &&
        (measurements.cache === null ? (
          <FirstVisit measurements={measurements} />
        ) : (
          <CachedMeasurements
            cache={measurements.cache}
            measurements={measurements}
          />
        ))}
    </main>
  );
}

/** The page before the first fetch: one sentence and the button. */
function FirstVisit({ measurements }: { measurements: Measurements }) {
  return (
    <>
      <Text className={classes.intro}>
        Diese Seite liest deine Gewichtsmessungen aus Google Health und zeigt
        dir, ob du noch abnimmst.
      </Text>
      <FetchState measurements={measurements} />
      <ProblemLine problem={measurements.problem} />
    </>
  );
}

function CachedMeasurements({
  cache,
  measurements,
}: {
  cache: MeasurementCache;
  measurements: Measurements;
}) {
  return (
    <>
      <LatestMeasurement cache={cache} />
      <ProblemLine problem={measurements.problem} />
      <FetchState measurements={measurements} />
      <UnstyledButton className={classes.logout} onClick={measurements.logOut}>
        Abmelden
      </UnstyledButton>
    </>
  );
}

/** „Letzte Messung“: the newest measurement, counting or not. */
function LatestMeasurement({ cache }: { cache: MeasurementCache }) {
  const latest = latestMeasurement(cache.measurements);
  return (
    <Text className={classes.latest}>
      {latest === null
        ? "Noch keine Messung in Google Health in den letzten 90 Tagen"
        : `Letzte Messung ${formatDay(latest.time)} um ${formatTime(latest.time)} Uhr: ${formatKg(latest.kg)} kg`}
    </Text>
  );
}

/** Where the verdict will stand: the busy line while fetching, else the button where a fetch needs sign-in. */
function FetchState({ measurements }: { measurements: Measurements }) {
  if (measurements.fetching) {
    return <Text className={classes.busy}>Wird aktualisiert …</Text>;
  }
  if (measurements.signedIn) return null;
  return (
    <Button
      className={classes.fetch}
      // Mantine sets the text colour on the element itself, past the class.
      vars={() => ({ root: { "--button-color": "#DDE1E5" } })}
      onClick={measurements.fetchData}
    >
      Daten abrufen
    </Button>
  );
}

function ProblemLine({ problem }: { problem: Problem | null }) {
  if (problem === null) return null;
  if (problem.action === "fetch") {
    return (
      <Text className={classes.problem} role="alert">
        {`Abruf fehlgeschlagen: ${reason(problem.error)}`}
      </Text>
    );
  }
  return (
    <div className={classes.problem} role="alert">
      <Text inherit>{`Widerruf fehlgeschlagen: ${reason(problem.error)}`}</Text>
      <Text inherit>
        Die Seite darf deine Gewichtsmessungen weiter lesen. Den Zugriff
        entfernst du in{" "}
        <Anchor
          inherit
          underline="always"
          c="inherit"
          href="https://myaccount.google.com/connections"
        >
          deinem Google-Konto
        </Anchor>
        .
      </Text>
    </div>
  );
}

function reason(error: GoogleHealthError): string {
  switch (error.kind) {
    case "signInUnavailable":
      return "Die Anmeldung bei Google ist nicht geladen.";
    case "signInFailed":
      return "Die Anmeldung bei Google wurde abgebrochen.";
    case "accessNotGranted":
      return "Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.";
    case "tokenRejected":
      return "Die Anmeldung ist abgelaufen.";
    case "unreachable":
      return "Google antwortet nicht.";
    case "failed":
      return `Google meldet den Fehler ${error.status}.`;
    case "unexpectedResponse":
      return "Google antwortet unerwartet.";
    case "revokeFailed":
      return "Google hat den Zugriff nicht widerrufen.";
  }
}

/** What went wrong on the page, and in doing what. */
interface Problem {
  action: "fetch" | "revoke";
  error: GoogleHealthError;
}

/** The measurements on the page and what the person can do with them. */
interface Measurements {
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
function useMeasurements(): Measurements | null {
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
