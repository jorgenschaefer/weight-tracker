"use client";

import { Anchor, Text, UnstyledButton } from "@mantine/core";
import { useEffect, useState } from "react";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import type { GoogleHealthError } from "@/measurement/google-health";
import {
  countingMeasurements,
  latestMeasurement,
  type Measurement,
} from "@/measurement/measurement";
import { type Assessment, assess } from "@/verdict/assessment";
import { EntrySheet } from "./EntrySheet";
import { failureReason } from "./failure-reason";
import { formatDay, formatKg, formatTime } from "./format";
import { GoogleStatus } from "./GoogleStatus";
import classes from "./page.module.css";
import { type Measurements, useMeasurements } from "./useMeasurements";
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
    return <Surface colours={NEUTRAL} measurements={null} today={today} />;
  }
  const { cache, enteredMeasurements } = measurements;
  if (cache === null && enteredMeasurements.length === 0) {
    return (
      <Surface colours={NEUTRAL} measurements={measurements} today={today}>
        <FirstVisit measurements={measurements} />
      </Surface>
    );
  }
  const shown = [...(cache?.measurements ?? []), ...enteredMeasurements];
  const assessment = assess(countingMeasurements(shown), today);
  const colours = surfaceColours(assessment.status);
  return (
    <Surface colours={colours} measurements={measurements} today={today}>
      <CachedMeasurements
        shown={shown}
        assessment={assessment}
        today={today}
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
 * The colour field: the whole screen, its content in the middle under the
 * status line, and the button to enter a weight, in every state of the page.
 * The browser around the page, Android's status bar and address bar, takes
 * its colour. `measurements` is `null` for the moment before the page has
 * read its cache, in which neither the status line nor the button does
 * anything.
 */
function Surface({
  colours,
  measurements,
  today,
  children,
}: {
  colours: SurfaceColours;
  measurements: Measurements | null;
  today: CalendarDay;
  children?: React.ReactNode;
}) {
  return (
    <main
      className={classes.surface}
      style={{ backgroundColor: colours.surface, color: colours.ink }}
    >
      {/* React moves it into <head> and keeps it there in step. */}
      <meta name="theme-color" content={colours.surface} />
      <div className={classes.content}>
        <GoogleStatus measurements={measurements} today={today} />
        {children}
      </div>
      <EntrySheet
        colours={colours}
        onEnter={measurements === null ? null : measurements.enter}
      />
    </main>
  );
}

/**
 * The page before the first fetch: what it does, and where to sign in. A
 * failed „Abmelden“ ends here.
 */
function FirstVisit({ measurements }: { measurements: Measurements }) {
  return (
    <>
      <Text className={classes.intro}>
        Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue
        ein und zeigt dir, ob du noch abnimmst.
      </Text>
      <Text className={classes.hint}>
        Tippe oben auf die Zeile, um dich bei Google anzumelden.
      </Text>
      <RevokeFailure error={measurements.revokeFailure} />
    </>
  );
}

/**
 * The page from the measurements `shown`, the cached ones and those entered
 * that Google Health has not returned yet: the verdict on `today` and the
 * four figures, and the graph under them.
 */
function CachedMeasurements({
  shown,
  assessment,
  today,
  measurements,
}: {
  shown: Measurement[];
  assessment: Assessment;
  today: CalendarDay;
  measurements: Measurements;
}) {
  return (
    <>
      <LatestMeasurement
        shown={shown}
        enteredMeasurements={measurements.enteredMeasurements}
      />
      <RevokeFailure error={measurements.revokeFailure} />
      <div className={classes.summary}>
        <section className={classes.verdict}>
          <Verdict status={assessment.status} />
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

/**
 * Why revoking the page's access failed, and where to remove it instead;
 * nothing where it did not fail.
 */
function RevokeFailure({ error }: { error: GoogleHealthError | null }) {
  if (error === null) return null;
  return (
    <div className={classes.problem} role="alert">
      <Text inherit>{`Widerruf fehlgeschlagen: ${failureReason(error)}`}</Text>
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
