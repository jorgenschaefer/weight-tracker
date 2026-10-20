"use client";

import { Anchor, Button, Text, UnstyledButton } from "@mantine/core";
import { useEffect, useState } from "react";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import {
  countingMeasurements,
  latestMeasurement,
  type Measurement,
} from "@/measurement/measurement";
import { type Assessment, assess } from "@/verdict/assessment";
import { type EnterWeight, EntrySheet } from "./EntrySheet";
import { failureReason } from "./failure-reason";
import { formatDay, formatKg, formatTime } from "./format";
import { LongTerm } from "./LongTerm";
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
  if (measurements === null) {
    return <Surface colours={NEUTRAL} onEnter={null} />;
  }
  const { cache, enteredMeasurements } = measurements;
  if (cache === null && enteredMeasurements.length === 0) {
    return (
      <Surface colours={NEUTRAL} onEnter={measurements.enter}>
        <FirstVisit measurements={measurements} />
      </Surface>
    );
  }
  const shown = [...(cache?.measurements ?? []), ...enteredMeasurements];
  const assessment = assess(countingMeasurements(shown), today);
  const colours = surfaceColours(assessment.status);
  return (
    <Surface colours={colours} onEnter={measurements.enter}>
      <CachedMeasurements
        shown={shown}
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

/**
 * The colour field: the whole screen, its content in the middle, and the
 * button to enter a weight in every state of the page. The browser around the
 * page, Android's status bar and address bar, takes its colour. `onEnter` is
 * `null` for the moment before the page has read its cache, in which the
 * button opens nothing.
 */
function Surface({
  colours,
  onEnter,
  children,
}: {
  colours: SurfaceColours;
  onEnter: EnterWeight | null;
  children?: React.ReactNode;
}) {
  return (
    <main
      className={classes.surface}
      style={{ backgroundColor: colours.surface, color: colours.ink }}
    >
      {/* React moves it into <head> and keeps it there in step. */}
      <meta name="theme-color" content={colours.surface} />
      <div className={classes.content}>{children}</div>
      <EntrySheet colours={colours} onEnter={onEnter} />
    </main>
  );
}

/** The page before the first fetch: one sentence and the button. */
function FirstVisit({ measurements }: { measurements: Measurements }) {
  return (
    <>
      <Text className={classes.intro}>
        Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue
        ein und zeigt dir, ob du noch abnimmst.
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
 * The page from the measurements `shown`, the cached ones and those entered
 * that Google Health has not returned yet: the verdict on `today`, the
 * 28-day pace and the figures, and the graph under them.
 */
function CachedMeasurements({
  shown,
  assessment,
  today,
  colours,
  measurements,
}: {
  shown: Measurement[];
  assessment: Assessment;
  today: CalendarDay;
  colours: SurfaceColours;
  measurements: Measurements;
}) {
  return (
    <>
      <LatestMeasurement
        shown={shown}
        enteredMeasurements={measurements.enteredMeasurements}
      />
      <ProblemLine problem={measurements.problem} />
      <div className={classes.summary}>
        <section className={classes.verdict} aria-busy={measurements.fetching}>
          {measurements.fetching && (
            <Text className={classes.busy}>Vorläufig, wird aktualisiert …</Text>
          )}
          <Verdict assessment={assessment} />
          <FetchButton measurements={measurements} colours={colours} />
        </section>
        {assessment.measuredKg !== null && (
          <div className={classes.overview}>
            <LongTerm pace={assessment.pace} />
            <Figures assessment={assessment} />
          </div>
        )}
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

/**
 * „Letzte Messung“: the newest measurement `shown`, counting or not, and
 * whether it is one entered that no fetch has held yet.
 */
function LatestMeasurement({
  shown,
  enteredMeasurements,
}: {
  shown: Measurement[];
  enteredMeasurements: Measurement[];
}) {
  const latest = latestMeasurement(shown);
  if (latest === null) {
    return (
      <Text className={classes.latest}>
        Noch keine Messung in Google Health in den letzten 90 Tagen
      </Text>
    );
  }
  const notYetFetched = enteredMeasurements.includes(latest)
    ? ", noch nicht aus Google Health abgerufen"
    : "";
  return (
    <Text className={classes.latest}>
      {`Letzte Messung ${formatDay(latest.time)} um ${formatTime(latest.time)} Uhr: ${formatKg(latest.kg)} kg${notYetFetched}`}
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
        {`Abruf fehlgeschlagen: ${failureReason(problem.error)}`}
      </Text>
    );
  }
  return (
    <div className={classes.problem} role="alert">
      <Text
        inherit
      >{`Widerruf fehlgeschlagen: ${failureReason(problem.error)}`}</Text>
      <Text inherit>
        Die Seite darf deine Gewichtsmessungen weiter lesen und eintragen. Den
        Zugriff entfernst du in{" "}
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
