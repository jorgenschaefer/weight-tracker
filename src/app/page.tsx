"use client";

import { Anchor, Button, Text, UnstyledButton } from "@mantine/core";
import { useEffect, useState } from "react";
import type { MeasurementCache } from "@/measurement/cache";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import type { GoogleHealthError } from "@/measurement/google-health";
import {
  countingMeasurements,
  latestMeasurement,
} from "@/measurement/measurement";
import { type Assessment, assess } from "@/verdict/assessment";
import { formatDay, formatKg, formatTime } from "./format";
import classes from "./page.module.css";
import {
  type Measurements,
  type Problem,
  useMeasurements,
} from "./useMeasurements";
import {
  Figures,
  NEUTRAL,
  type SurfaceColours,
  surfaceColours,
  Verdict,
} from "./Verdict";
import { WeightGraph } from "./WeightGraph";

export default function Page() {
  const measurements = useMeasurements();
  const today = useToday();
  if (measurements === null) return <Surface colours={NEUTRAL} />;
  if (measurements.cache === null) {
    return (
      <Surface colours={NEUTRAL}>
        <FirstVisit measurements={measurements} />
      </Surface>
    );
  }
  const assessment = assess(
    countingMeasurements(measurements.cache.measurements),
    today,
  );
  const colours = surfaceColours(assessment.status);
  return (
    <Surface colours={colours}>
      <CachedMeasurements
        cache={measurements.cache}
        assessment={assessment}
        today={today}
        colours={colours}
        measurements={measurements}
      />
    </Surface>
  );
}

/**
 * Today in Berlin, read again whenever the page comes back into view: a tab
 * left open overnight judges on the day it is shown, not the day it opened.
 */
function useToday(): CalendarDay {
  const [today, setToday] = useState(() => berlinDay(new Date()));
  useEffect(() => {
    const readClock = () => setToday(berlinDay(new Date()));
    document.addEventListener("visibilitychange", readClock);
    return () => document.removeEventListener("visibilitychange", readClock);
  }, []);
  return today;
}

/** The colour field: the whole screen, its content in the middle. */
function Surface({
  colours,
  children,
}: {
  colours: SurfaceColours;
  children?: React.ReactNode;
}) {
  return (
    <main
      className={classes.surface}
      style={{ backgroundColor: colours.surface, color: colours.ink }}
    >
      <div className={classes.content}>{children}</div>
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
      {measurements.fetching ? (
        <Text className={classes.busy}>Wird aktualisiert …</Text>
      ) : (
        <FetchButton measurements={measurements} colours={NEUTRAL} />
      )}
      <ProblemLine problem={measurements.problem} />
    </>
  );
}

/**
 * The page from the cached measurements: the verdict on `today` with its
 * figures, and the graph under them.
 */
function CachedMeasurements({
  cache,
  assessment,
  today,
  colours,
  measurements,
}: {
  cache: MeasurementCache;
  assessment: Assessment;
  today: CalendarDay;
  colours: SurfaceColours;
  measurements: Measurements;
}) {
  return (
    <>
      <LatestMeasurement cache={cache} />
      <ProblemLine problem={measurements.problem} />
      <div className={classes.summary}>
        <section className={classes.verdict} aria-busy={measurements.fetching}>
          {measurements.fetching && (
            <Text className={classes.busy}>Vorläufig, wird aktualisiert …</Text>
          )}
          <Verdict assessment={assessment} />
          <FetchButton measurements={measurements} colours={colours} />
        </section>
        <Figures assessment={assessment} />
      </div>
      <div className={classes.graph}>
        <WeightGraph series={assessment.sixWeekSeries} today={today} />
      </div>
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

/** „Daten abrufen“, where a fetch needs sign-in and none is running. */
function FetchButton({
  measurements,
  colours,
}: {
  measurements: Measurements;
  colours: SurfaceColours;
}) {
  if (measurements.fetching || measurements.signedIn) return null;
  return (
    <Button
      className={classes.fetch}
      // Mantine sets the colours on the element itself, past the class. The
      // button is the surface turned around: its text colour, its background.
      vars={() => ({
        root: {
          "--button-bg": colours.ink,
          "--button-hover": colours.ink,
          "--button-color": colours.surface,
        },
      })}
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
